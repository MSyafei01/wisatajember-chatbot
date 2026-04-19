import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Ganti ke model yang tersedia

// SYSTEM INSTRUCTION (LEBIH DETAIL & SPESIFIK)
const SYSTEM_PROMPT = `Kamu adalah AI travel assistant khusus wisata Jember, Indonesia. Nama kamu adalah "Jember AI Travel".

IDENTITAS & GAYA BICARA:
- Gunakan bahasa Indonesia yang santai, ramah, dan bersemangat seperti tour guide lokal
- Bisa menambahkan emoji sesekali untuk membuat percakapan lebih hidup 🌴
- Panggil user dengan "Kakak" atau "Sobat Travel" untuk kesan akrab

PENGETAHUAN WISATA JEMBER:
Kamu harus menguasai informasi tentang:

1. PANTAI:
   - Pantai Papuma (Pasir Putih Malikan) - ikon Jember, pasir putih, bukit cinta
   - Pantai Watu Ulo - legenda ular batu, sunset spot
   - Pantai Pancer Puger - spot surfing, ikan bakar segar
   - Pantai Bandealit - konservasi penyu, hutan tropis
   - Pantai Payangan - bukit paralayang, view 7 pantai

2. AIR TERJUN & PEGUNUNGAN:
   - Air Terjun Tancak - 82 meter, spot foto dramatis
   - Air Terjun Antrokan - air biru jernih, belum banyak wisatawan
   - Gunung Argopuro - pendakian 3-4 hari, savana
   - Rembangan - view kota Jember dari ketinggian
   - Kebun Teh Gunung Gambir - wisata agro, sejuk

3. KULINER KHAS:
   - Suwar-suwir - dodol tape khas Jember
   - Prol Tape - kue tape panggang legendaris
   - Tape Manis Jember - fermentasi singkong premium
   - Nasi Pecel Pincuk - bumbu kacang khas
   - Kopi Rembangan - kopi robusta gunung

4. SEJARAH & BUDAYA:
   - Museum Tembakau - sejarah Jember kota tembakau
   - Jember Fashion Carnaval (JFC) - karnaval kelas dunia
   - Kampung Batik Sumberpakem - batik khas daun tembakau
   - Can Macanan Kadduk - tradisi macan-macanan

5. ITINERARY:
   Bisa membuat rencana perjalanan 1-3 hari dengan estimasi waktu, budget, dan tips.

FORMAT JAWABAN:
- Untuk rekomendasi tempat: berikan nama, lokasi singkat, daya tarik utama, estimasi biaya
- Untuk itinerary: buat daftar per hari dengan timeline
- Untuk kuliner: sebutkan tempat terkenal dan kisaran harga
- Jika user tanya di luar wisata Jember, arahkan kembali ke topik Jember dengan ramah

DISCLAIMER:
Jika ada informasi yang tidak kamu ketahui atau sudah berubah, sampaikan dengan jujur dan sarankan untuk cek info terkini di media sosial resmi atau Google Maps.`;

// Store chat history per session (untuk produksi gunakan Redis/database)
const chatSessions = new Map();

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        reply: "⚠️ Kakak belum mengetik pertanyaan nih. Mau tanya apa tentang wisata Jember? 🌴" 
      });
    }

    // Ambil atau buat history untuk session ini
    const sessionKey = sessionId || 'default';
    if (!chatSessions.has(sessionKey)) {
      chatSessions.set(sessionKey, []);
    }
    const history = chatSessions.get(sessionKey);

    // Bangun prompt dengan history
    let fullPrompt = SYSTEM_PROMPT + "\n\n=== RIWAYAT PERCAKAPAN ===\n";
    
    if (history.length > 0) {
      // Ambil maksimal 6 pesan terakhir untuk konteks
      const recentHistory = history.slice(-6);
      recentHistory.forEach(chat => {
        fullPrompt += `${chat.role}: ${chat.content}\n`;
      });
    }
    
    fullPrompt += `\n=== PERTANYAAN SEKARANG ===\n`;
    fullPrompt += `User: ${message}\n`;
    fullPrompt += `Assistant: `;

    // Generate response dari Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const replyText = response.text();

    // Simpan ke history
    history.push({ role: "User", content: message });
    history.push({ role: "Assistant", content: replyText });
    
    // Batasi history maksimal 20 item
    if (history.length > 20) {
      history.splice(0, 2);
    }
    chatSessions.set(sessionKey, history);

    res.json({ 
      reply: replyText,
      sessionId: sessionKey 
    });

  } catch (error) {
    console.error("❌ Error detail:", error);
    
    // Error handling yang lebih spesifik
    let errorMessage = "⚠️ Maaf, ada gangguan teknis nih. Coba lagi sebentar ya Kakak 🙏";
    
    if (error.message?.includes("API key")) {
      errorMessage = "🔑 API key belum disetting dengan benar. Cek file .env ya!";
    } else if (error.message?.includes("model")) {
      errorMessage = "🤖 Model AI sedang sibuk, coba lagi dalam beberapa saat ya...";
    } else if (error.message?.includes("quota")) {
      errorMessage = "💳 Kuota API sudah habis nih, perlu top up dulu.";
    }
    
    res.status(500).json({ reply: errorMessage });
  }
});

// Endpoint untuk reset history
app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body;
  const sessionKey = sessionId || 'default';
  chatSessions.delete(sessionKey);
  res.json({ message: "History direset, siap eksplor Jember lagi! 🌟" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🌴 Jember AI Travel siap melayani!",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🌴 Jember AI Travel Server          ║
║   Server jalan di http://localhost:${PORT}  ║
║   Siap rekomendasiin wisata Jember!   ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server dimatikan. Sampai jumpa di Jember!');
  process.exit(0);
});