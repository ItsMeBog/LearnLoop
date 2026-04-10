import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function handler(event) {
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { text } = JSON.parse(event.body || "{}");

    // Validate input
    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No PDF text provided.",
        }),
      };
    }

    // Prompt for Gemini
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

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";

    // Clean markdown if Gemini wraps JSON
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanedText);
    } catch (err) {
      console.error("JSON parse error:", err);
      console.error("Raw Gemini response:", rawText);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "AI returned invalid JSON.",
        }),
      };
    }

    // Validate structure
    if (
      !parsed ||
      !Array.isArray(parsed.flashcards) ||
      !Array.isArray(parsed.quiz)
    ) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "AI response format is invalid.",
        }),
      };
    }

    // Success
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    console.error("Gemini function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate study material.",
        details: error.message,
      }),
    };
  }
}