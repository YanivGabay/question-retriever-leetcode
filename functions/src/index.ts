import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface QuestionData {
  title: string;
  difficulty: string;
  titleSlug: string;
}

interface AISummary {
  solution: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export const getQuestionSummary = functions.https.onCall(
  async (request): Promise<AISummary> => {
    const data = request.data as QuestionData;
    const {title, difficulty, titleSlug} = data;

    // Get API key from Firebase config
    const apiKey = process.env.OPENROUTER_API_KEY ||
      functions.config().openrouter?.api_key;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "OpenRouter API key not configured"
      );
    }

    const prompt = `You are a LeetCode expert. Given this problem:

Title: ${title}
Difficulty: ${difficulty}
URL: https://leetcode.com/problems/${titleSlug}

Respond in Hebrew with ONLY this exact format (no extra text):

פתרון: [1-2 sentences describing the optimal approach]
זמן: O([complexity])
מקום: O([complexity])`;

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://leetcode-question-retriever.web.app",
          "X-Title": "LeetCode Question Retriever",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", errorText);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to get AI response"
        );
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";

      // Parse the response
      const solutionMatch = content.match(/פתרון:\s*(.+?)(?=\nזמן:|$)/s);
      const timeMatch = content.match(/זמן:\s*(O\([^)]+\))/);
      const spaceMatch = content.match(/מקום:\s*(O\([^)]+\))/);

      return {
        solution: solutionMatch?.[1]?.trim() || content.trim(),
        timeComplexity: timeMatch?.[1] || "O(?)",
        spaceComplexity: spaceMatch?.[1] || "O(?)",
      };
    } catch (error) {
      console.error("Error calling OpenRouter:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate summary"
      );
    }
  }
);
