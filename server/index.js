import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =============================================
// API KEY
// =============================================
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDUMskpACXGhr2_An8oDu8JEo0OxrTWKhY";

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// =============================================
// MODEL SELECTION - UNCOMMENT YANG AKTIF
// =============================================
// Ganti model di sini dan lihat perubahannya di terminal
const MODEL_NAME = "gemini-2.0-flash-exp"; // ⬅️ MODEL AKTIF SAAT INI
// const MODEL_NAME = "gemini-1.5-flash";
// const MODEL_NAME = "gemini-pro";
// const MODEL_NAME = "gemini-1.5-pro";

const model = genAI.getGenerativeModel({ model: MODEL_NAME });

console.log("========================================");
console.log("🤖 MODEL GEMINI YANG DIGUNAKAN:");
console.log(`   ➜ ${MODEL_NAME}`);
console.log("========================================");

// =============================================
// SYSTEM PROMPT (WISATA JEMBER)
// =============================================
const SYSTEM_PROMPT = `
Kamu adalah AI travel assistant khusus wisata Jember, Indonesia.

Karakter kamu:
- Ramah, santai, seperti tour guide lokal
- Memberikan jawaban praktis, tidak terlalu panjang
- Gunakan emoji seperlunya

Tugas:
- Rekomendasikan wisata di Jember
- Sesuaikan dengan budget, waktu, dan preferensi user
- Bisa membuat itinerary harian
- Berikan alasan kenapa tempat itu cocok

Rekomendasi tempat:
- Pantai Papuma
- Watu Ulo
- Rembangan
- Air Terjun Tancak
- Teluk Love
- Puncak Rembangan

Tambahkan juga:
- Estimasi biaya (jika memungkinkan)
- Waktu terbaik berkunjung
- Tips singkat

Jika pertanyaan di luar Jember, arahkan kembali ke wisata Jember.
Jika tidak yakin, beri disclaimer.
`;

// =============================================
// STORE CHAT HISTORY (SESSION MEMORY)
// =============================================
const chatSessions = new Map();

// =============================================
// API ENDPOINT: /api/model (Cek Model Aktif)
// =============================================
app.get("/api/model", (req, res) => {
  res.json({
    model: MODEL_NAME,
    provider: "Google Gemini AI",
    status: "active",
    timestamp: new Date().toISOString()
  });
});

// =============================================
// API ENDPOINT: /api/chat
// =============================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        reply: "⚠️ Kakak belum mengetik pertanyaan nih. Mau tanya apa tentang wisata Jember? 🌴" 
      });
    }

    const sessionKey = sessionId || 'default';
    if (!chatSessions.has(sessionKey)) {
      chatSessions.set(sessionKey, []);
    }
    const history = chatSessions.get(sessionKey);

    let fullPrompt = SYSTEM_PROMPT + "\n\n=== RIWAYAT PERCAKAPAN ===\n";
    
    if (history.length > 0) {
      const recentHistory = history.slice(-6);
      recentHistory.forEach(chat => {
        fullPrompt += `${chat.role}: ${chat.content}\n`;
      });
    }
    
    fullPrompt += `\n=== PERTANYAAN SEKARANG ===\n`;
    fullPrompt += `User: ${message}\n`;
    fullPrompt += `Assistant: `;

    console.log(`📨 [${MODEL_NAME}] Mengirim request ke Gemini...`);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const replyText = response.text();

    console.log(`✅ [${MODEL_NAME}] Response diterima`);

    history.push({ role: "User", content: message });
    history.push({ role: "Assistant", content: replyText });
    
    if (history.length > 20) {
      history.splice(0, 2);
    }
    chatSessions.set(sessionKey, history);

    res.json({ 
      reply: replyText,
      sessionId: sessionKey,
      model: MODEL_NAME // ⬅️ Kirim info model ke frontend
    });

  } catch (error) {
    console.error("❌ Error detail:", error.message);
    
    let errorMessage = "⚠️ Maaf, ada gangguan teknis nih. Coba lagi sebentar ya Kakak 🙏";
    
    if (error.message?.includes("API key")) {
      errorMessage = "🔑 API key tidak valid.";
    } else if (error.message?.includes("quota")) {
      errorMessage = "💳 Kuota API sudah habis.";
    } else if (error.message?.includes("not found") || error.message?.includes("404")) {
      errorMessage = `🤖 Model ${MODEL_NAME} tidak tersedia. Ganti ke model lain.`;
    }
    
    res.status(500).json({ reply: errorMessage });
  }
});

// =============================================
// API ENDPOINT: /api/reset
// =============================================
app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body;
  const sessionKey = sessionId || 'default';
  chatSessions.delete(sessionKey);
  res.json({ message: "History direset! 🌟" });
});

// =============================================
// API ENDPOINT: /api/health
// =============================================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🌴 Jember AI Travel siap melayani!",
    model: MODEL_NAME,
    timestamp: new Date().toISOString()
  });
});

// =============================================
// JALANKAN SERVER
// =============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║       🌴 Jember AI Travel Server                 ║
║       Server  : http://localhost:${PORT}         ║
║       Model   : ${MODEL_NAME}                    ║
║       Status  : Ready 🚀                         ║
╚══════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n👋 Server dimatikan.');
  process.exit(0);
});