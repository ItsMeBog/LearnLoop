import { GoogleGenerativeAI } from "@google/generative-ai";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing GEMINI_API_KEY in Netlify environment variables.",
        }),
      };
    }

    const { text } = JSON.parse(event.body || "{}");

    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No PDF text provided." }),
      };
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text() || "";
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw Gemini response:", rawText);

      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "AI returned invalid JSON.",
          raw: rawText,
        }),
      };
    }

    if (!parsed || !Array.isArray(parsed.flashcards) || !Array.isArray(parsed.quiz)) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "AI response format is invalid.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    console.error("Gemini function error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to generate study material.",
        details: error?.message || "Unknown server error",
      }),
    };
  }
}