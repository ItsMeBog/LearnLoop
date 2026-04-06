import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/generate-study-material", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "No PDF text provided.",
      });
    }

    const prompt = `
You are a study assistant.

Based only on the study material below, generate:
1. 5 flashcards
2. 5 multiple choice quiz questions

Return valid JSON only in this exact structure:
{
  "flashcards": [
    { "question": "string", "answer": "string" }
  ],
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string"
    }
  ]
}

Rules:
- The quiz must have exactly 4 options each
- The correctAnswer must match one of the options exactly
- Use clear student-friendly wording
- Base everything only on the provided study material
- Return JSON only, no explanation, no markdown

Study material:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Model raw response:", rawText);

      return res.status(500).json({
        error: "AI returned invalid JSON.",
      });
    }

    if (
      !parsed ||
      !Array.isArray(parsed.flashcards) ||
      !Array.isArray(parsed.quiz)
    ) {
      return res.status(500).json({
        error: "AI response format is invalid.",
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error("Gemini server error:", error);

    res.status(500).json({
      error: "Failed to generate study material.",
      details: error.message,
    });
  }
});

app.get("/", (_req, res) => {
  res.send("AI study material server is running.");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});