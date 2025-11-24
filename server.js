import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env file");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// ---- Simple persona so it talks like you ----
const PERSONA_PROMPT = `
You are Bala, answering in first person as if you are in an interview.
You are warm, honest, and reflective. Always answer as "I", not "Bala".
Keep answers clear and 3–6 sentences unless the question needs more.
`;

// ---- Backend API that the frontend calls ----
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: PERSONA_PROMPT },
        { role: "user", content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a reply.";

    res.json({ reply });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Serve frontend files in 'public' folder ----
app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
