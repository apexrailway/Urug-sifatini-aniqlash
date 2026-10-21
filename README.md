<div align="center">
<img width="1200" height="475" alt="Smart Seed Analyzer" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Smart Seed Analyzer (Aqlli Urug' Tahlilchisi)

Sun'iy intellekt (Google Gemini) yordamida qishloq xo'jaligi va don mahsulotlari (urug'lar) sifatini, sonini, sog'lom va shikastlangan qismlarini aniqlovchi zamonaviy veb-ilova.

---

## 🚀 Railway Hostingga Joylash (Deploy to Railway)

Ushbu loyiha **Railway** platformasiga to'liq moslashtirilgan (`railway.json`, `nixpacks.toml`, `Procfile` va ko'p bosqichli `Dockerfile` tayyorlangan).

### 1-usul: GitHub orqali (Eng oson va tavsiya etilgan usul)

1. Loyihani o'zingizning GitHub hisobingizga yuklang (Push):
   ```bash
   git init
   git add .
   git commit -m "Railway hosting uchun tayyorlandi"
   git remote add origin https://github.com/USERNAME/smart-seed-analyzer.git
   git branch -M main
   git push -u origin main
   ```
2. [Railway.app](https://railway.app/) saytiga kiring.
3. **"New Project"** -> **"Deploy from GitHub repo"** ni tanlang va repozitoriyangizni belgilang.
4. **Variables (Muhit o'zgaruvchilari)** bo'limiga quyidagi o'zgaruvchini kiriting:
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
5. Railway avtomatik tarzda `npm run build` qilib, ilovani ishga tushiradi (`npm start`).
6. **Networking** bo'limida **"Generate Domain"** tugmasini bosing va tayyor havola (URL) orqali ilovadan foydalaning!

---

### 2-usul: Railway CLI orqali to'g'ridan-to'g'ri terminaldan

1. Railway CLI-ni o'rnating (agar o'rnatilmagan bo'lsa):
   ```bash
   npm i -g @railway/cli
   ```
2. Tizimga kiring:
   ```bash
   railway login
   ```
3. Loyiha papkasida bog'lang va ishga tushiring:
   ```bash
   railway init
   railway up
   ```
4. O'zgaruvchini sozlang:
   ```bash
   railway variables set GEMINI_API_KEY="your_gemini_api_key_here"
   ```
5. Domen ochish:
   ```bash
   railway domain
   ```

---

## 💻 Mahalliy Kompyuterda Ishga Tushirish (Run Locally)

1. **Bog'liqliklarni o'rnatish:**
   ```bash
   npm install
   ```

2. **Dasturchi rejimida (Dev server):**
   ```bash
   npm run dev
   ```
   Brauzerda oching: `http://localhost:3000`

3. **Ishlab chiqarish (Production) rejimida sinab ko'rish:**
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ Sozlamalar va Xususiyatlar

- **Dinamik Port:** `PORT` muhit o'zgaruvchisi avtomatik qo'llaniladi (Railway mosligi).
- **Salomatlik tekshiruvi (Healthcheck):** `/api/health` yo'li orqali Railway server holatini kuzatib turadi.
- **Xavfsizlik:** Server kodi (`dist/server.cjs`) va source-map fayllari tashqi foydalanuvchilardan himoyalangan.
- **Express 5 SPA Routing:** Barcha yo'nalishlar (`/{*splat}`) to'g'ri Single Page Application sifatida xizmat ko'rsatadi.
