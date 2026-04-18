import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// SYSTEM INSTRUCTION (BIAR PINTER & KHAS JEMBER)
const SYSTEM_PROMPT = `
Kamu adalah AI travel assistant khusus wisata Jember, Indonesia.

Tugas kamu:
- Memberikan rekomendasi wisata di Jember
- Menyesuaikan dengan budget, waktu, dan preferensi user
- Bisa membuat itinerary
- Gunakan bahasa santai, ramah seperti tour guide lokal

Rekomendasikan tempat seperti:
Pantai Papuma, Watu Ulo, Rembangan, Air Terjun Tancak, dll.

Jika tidak yakin, beri disclaimer.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message kosong" });
    }

    const prompt = `${SYSTEM_PROMPT}\nUser: ${message}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});