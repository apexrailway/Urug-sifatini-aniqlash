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

    const systemInstruction = `Sen qishloq xo'jaligi va urug'chilik bo'yicha yuqori malakali ekspert hamda kompyuter ko'rishi (Computer Vision) tahlilchisisan.
Vazifang: Rasmdagi har bir alohida urug'ni aniqlash, uning 2D chegaralovchi ramkasini (bounding box [ymin, xmin, ymax, xmax]) topish, sifatini baholash va to'liq tahliliy hisobot tayyorlash.

Qat'iy qoidalar:
1. Chegaralovchi ramkalar (box_2d):
   - Har bir alohida urug' uchun [ymin, xmin, ymax, xmax] tartibida, 0 dan 1000 oralig'ida butun sonlar (0 <= ymin < ymax <= 1000, 0 <= xmin < xmax <= 1000).
   - Donlar zich yoki bir-biriga yopishib turgan bo'lsa ham, har bir donni alohida belgilashga harakat qil. Bitta don uchun takroriy ramka qo'shma.
2. Sifat tasnifi:
   - 'healthy' (sog'lom): Butun, yorilmagan, to'liq yetilgan, tabiiy rangdagi sifatli toza urug'lar.
   - 'broken' (yaroqsiz): Singan, yorilgan, qora yoki mog'or dog'li, po'sti zararlangan, chirigan, chala yetilgan yoki begona zararkunanda/iflosliklar.
3. Matematik muvofiqlik:
   - 'total' = 'healthy' + 'broken' tenglamasiga qat'iy rioya qil.
   - 'seeds' massividagi jami elementlar soni ham 'total' ga teng bo'lishi shart.
4. Xulosa ('summary'):
   - Mahsulotning umumiy sifati, tozalik darajasi va ekishga yoki saqlashga yaroqliligi haqida o'zbek tilida 2-3 jumlali professional agronomik xulosa yoz.`;

    const prompt = `Ushbu rasmdagi barcha don va urug'larni birma-bir o'ta sinchkovlik bilan aniqla. Har bir aniqlangan don uchun [ymin, xmin, ymax, xmax] chegaralarini (0-1000 oralig'ida) va uning sifat turini ('healthy' yoki 'broken') belgilab ber.`;

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
            temperature: 0.1,
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.NUMBER, description: "Total number of seeds detected (healthy + broken)" },
                healthy: { type: Type.NUMBER, description: "Number of healthy, good quality seeds" },
                broken: { type: Type.NUMBER, description: "Number of broken, immature, or damaged seeds" },
                summary: { type: Type.STRING, description: "A short professional agronomical summary in Uzbek" },
                seeds: {
                  type: Type.ARRAY,
                  description: "Detected seeds coordinates and metadata. Provide coordinates for all detected seeds to ensure detailed visual mapping.",
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

        // Mantiqiy muvozanatlash va aniqlik nazorati (Data consistency guard)
        if (Array.isArray(parsedResult.seeds) && parsedResult.seeds.length > 0) {
          const healthyCount = parsedResult.seeds.filter((s: any) => s.type === "healthy").length;
          const brokenCount = parsedResult.seeds.filter((s: any) => s.type === "broken").length;
          parsedResult.healthy = healthyCount;
          parsedResult.broken = brokenCount;
          parsedResult.total = parsedResult.seeds.length;
        }

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
