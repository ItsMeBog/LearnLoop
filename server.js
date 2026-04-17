import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cron from "node-cron";
import { checkEmailReminders } from "./checkEmailReminders.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(helmet());

app.use(
  cors({
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: false,
  }),
);

app.use(express.json({ limit: "2mb" }));

const studyMaterialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/", (_req, res) => {
  res.send("AI study material server is running.");
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ✅ CORRECT MODEL IDS */
const MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

const getRetryDelayMs = (error) => {
  const retryDelay =
    error?.errorDetails
      ?.find(
        (item) =>
          item?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
      )
      ?.retryDelay || "";

  const seconds = Number(String(retryDelay).replace("s", ""));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 2000;
};

const isRetryableError = (error) => {
  return (
    error?.status === 429 ||
    error?.status === 500 ||
    error?.status === 503
  );
};

/* ✅ FALLBACK SYSTEM */
const generateWithGeminiFallback = async (prompt) => {
  let lastError;

  for (let i = 0; i < MODELS.length; i++) {
    const modelName = MODELS[i];

    try {
      console.log("Trying model:", modelName);

      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);

      console.log("Success with:", modelName);
      return result;
    } catch (error) {
      lastError = error;

      console.error(`Model failed: ${modelName}`, error?.status);

      const isLast = i === MODELS.length - 1;

      if (!isRetryableError(error) || isLast) {
        break;
      }

      await sleep(getRetryDelayMs(error));
    }
  }

  throw lastError;
};

app.post("/api/generate-study-material", studyMaterialLimiter, async (req, res) => {
  try {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "No PDF text provided.",
      });
    }

    const cleanedInput = text.trim();

    if (cleanedInput.length > 30000) {
      return res.status(400).json({
        error: "PDF text is too long. Please upload a shorter file.",
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
${cleanedInput}
`;

    const result = await generateWithGeminiFallback(prompt);

    const rawText = result?.response?.text() || "";
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
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

    return res.json(parsed);
  } catch (error) {
    console.error("Gemini server error:", error);

    if (error?.status === 429) {
      return res.status(429).json({
        error: "Daily AI limit reached. Please try again later.",
      });
    }

    if (error?.status === 503) {
      return res.status(503).json({
        error: "AI is busy right now. Please try again in a few moments.",
      });
    }

    return res.status(500).json({
      error: "Failed to generate study material.",
    });
  }
});

cron.schedule("*/5 * * * *", async () => {
  try {
    await checkEmailReminders();
  } catch (error) {
    console.error("Cron reminder error:", error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});