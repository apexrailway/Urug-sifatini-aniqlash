import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables from .env file if available
dotenv.config();

const app = express();
// Railway dynamically assigns a port via process.env.PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || "";
}

// Enable JSON payloads with proper size limit for base64 images
app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Google Gen AI client with caching
let geminiClient: GoogleGenAI | null = null;
let currentClientKey: string | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  if (!geminiClient || currentClientKey !== apiKey) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    currentClientKey = apiKey;
  }
  return geminiClient;
}

// API Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API endpoint for seed analysis
app.post("/api/analyze-seed", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Rasm yuklanmadi. Rasm ma'lumotlari talab qilinadi." });
    }

    // Check if GEMINI_API_KEY is available
    if (!getApiKey()) {
      return res.status(500).json({
        error: "Tizim konfiguratsiyasi xatosi: GEMINI_API_KEY topilmadi. Sozlamalardan kalitni qo'shing."
      });
    }

    const ai = getGeminiClient();

    // Remove base64 metadata prefix if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = image.split(",")[1] || image;

    const prompt = `
      Sen qishloq xo'jaligi va don mahsulotlari sifatini nazorat qilish bo'yicha yuqori malakali mutaxassis va sun'iy intellekt tahlilchisisan. Ushbu rasmdagi barcha urug'larni (donlarni) o'ta yuqori aniqlikda tahlil qil.
      
      Quyidagilarni aniqlashing shart:
      1. Rasmdagi umumiy donlar soni (barcha donlar - to'liq, yarim, chekkadagi va zich joylashgan donlarni ham to'liq qamrab olishga harakat qil).
      2. Nechtasi sog'lom, butun, pishgan va sifatli.
      3. Nechtasi singan, shikastlangan, po'sti shilingan, rangi o'zgargan (qora, kulrang nuqtali), chirigan yoki chala pishgan (yaroqsiz donlar).
      4. Rasmda donlar zich va juda ko'p bo'lsa ham ularning koordinatalarini aniqlash sifatiga katta e'tibor ber. Rasmda aniqlangan donlarning koordinatalarini (bounding box) [ymin, xmin, ymax, xmax] formatida (0 dan 1000 oralig'ida) aniqla. Imkon qadar barcha aniqlangan donlar uchun (120-150 don oralig'ida bo'lsa ham to'liq) koordinatalarini 'seeds' massiviga kirit. Bu orqali foydalanuvchi ekranda donlarning qayerda joylashganini va qaysi biri sog'lom/yaroqsiz ekanligini to'liq ko'ra olsin.
      
      5. Qisqacha tahliliy xulosa yoz (o'zbek tilida).

      Javobni aniq JSON formatida qaytar.
    `;

    // Rasmni tahlil qilish va obyektlarni aniqlash uchun rasmiy gemini-3.8-flash modeli
    const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    const maxRetries = 5;
    let attempt = 0;
    let lastError: any = null;
    let responseText = "";

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < maxRetries) {
      const currentModel = modelsToTry[attempt % modelsToTry.length];
      try {
        console.log(`[Gemini API] Tahlil urinishi ${attempt + 1}/${maxRetries}. Model: ${currentModel}`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            prompt,
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.NUMBER, description: "Total number of seeds detected" },
                healthy: { type: Type.NUMBER, description: "Number of healthy, good quality seeds" },
                broken: { type: Type.NUMBER, description: "Number of broken, immature, or damaged seeds" },
                summary: { type: Type.STRING, description: "A short summary of the analysis in Uzbek" },
                seeds: {
                  type: Type.ARRAY,
                  description: "Detected seeds coordinates and metadata. Provide coordinates for all detected seeds (up to 150 boxes) to ensure extremely detailed visual mapping.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Must be 'healthy' or 'broken' based on seed state" },
                      box_2d: {
                        type: Type.ARRAY,
                        description: "[ymin, xmin, ymax, xmax] coordinate bounds normalized 0 to 1000.",
                        items: { type: Type.NUMBER }
                      }
                    },
                    required: ["type", "box_2d"]
                  }
                }
              },
              required: ["total", "healthy", "broken", "summary", "seeds"],
            },
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break; // Success! Exit retry loop.
        } else {
          throw new Error("Sun'iy intellektdan bo'sh javob qaytdi.");
        }
      } catch (err: any) {
        attempt++;
        lastError = err;
        const errMsg = err?.message || String(err);
        
        // Match standard HTTP status codes (503, 429), gRPC codes (UNAVAILABLE, RESOURCE_EXHAUSTED), or general overloaded messages
        const isTransient = 
          errMsg.includes("503") || 
          errMsg.includes("429") || 
          errMsg.includes("UNAVAILABLE") || 
          errMsg.includes("RESOURCE_EXHAUSTED") || 
          errMsg.toLocaleLowerCase().includes("demand") ||
          errMsg.toLocaleLowerCase().includes("overloaded") ||
          errMsg.toLocaleLowerCase().includes("spikes in demand") ||
          errMsg.toLocaleLowerCase().includes("temporary");

        if (isTransient && attempt < maxRetries) {
          // Exponential backoff: e.g. 1.2s, 3s, 6s... with randomness to prevent collision (thundering herd)
          const backoffTime = Math.round(1000 * Math.pow(1.8, attempt) + Math.random() * 500);
          console.warn(`[Gemini API Warning] Urinish ${attempt} xato berdi (${currentModel}): Transient fault. ${backoffTime}ms dan so'ng muqobil model bilan qayta uriniladi...`);
          await delay(backoffTime);
        } else {
          // If not transient, or if max retries exceeded, throw the error
          console.error(`[Gemini API Error] Urinish ${attempt} muvaffaqiyatsiz bo'ldi va qayta urinib bo'lmaydi (${currentModel}):`, errMsg);
          break;
        }
      }
    }

    if (responseText) {
      try {
        const parsedResult = JSON.parse(responseText.trim());
        return res.json(parsedResult);
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        return res.status(500).json({
          error: "Natijani tahlil qilib bo'lmadi. Sun'iy intellekt javobi noto'g'ri formatda.",
        });
      }
    } else {
      const finalErrorMsg = lastError?.message || String(lastError || "Noma'lum xatolik");
      let readableError = "Hozirda sun'iy intellekt xizmati haddan tashqari band. Iltimos 1-2 daqiqadan so'ng qaytadan rasm yuklab ko'ring.";
      if (finalErrorMsg.includes("API_KEY") || finalErrorMsg.includes("key")) {
        readableError = "Tizim konfiguratsiyasi xatosi: API kalit topilmadi ruxsatni sozlang.";
      }
      return res.status(503).json({
        error: `${readableError} (Tafsilot: ${finalErrorMsg})`,
      });
    }
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    return res.status(500).json({
      error: `Urug'larni tahlil qilishda xatolik yuz berdi: ${err.message || err}`,
    });
  }
});

// Vite middleware for development vs static build for production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import so vite isn't loaded or required in production runtime
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Security: Block direct requests to server bundle code and source maps
    app.use((req, res, next) => {
      if (req.path.startsWith("/server.cjs") || req.path.endsWith(".map")) {
        return res.status(404).send("Not Found");
      }
      next();
    });

    app.use(express.static(distPath));

    // Express 5 catch-all wildcard for Single Page Application
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Smart Seed Analyzer] Server running on http://0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || "development"})`);
  });
});
