import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
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

interface RetrievedQuestion {
  id?: string;
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  sentDate: string;
  aiSummary?: AISummary;
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

/**
 * Helper function to generate AI summary
 */
async function generateAISummary(
  question: {title: string; difficulty: string; titleSlug: string},
  apiKey: string
): Promise<AISummary> {
  const prompt = `You are a LeetCode expert. Given this problem:

Title: ${question.title}
Difficulty: ${question.difficulty}
URL: https://leetcode.com/problems/${question.titleSlug}

Respond in Hebrew with ONLY this exact format (no extra text):

פתרון: [1-2 sentences describing the optimal approach]
זמן: O([complexity])
מקום: O([complexity])`;

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
      messages: [{role: "user", content: prompt}],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${await response.text()}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";

  const solutionMatch = content.match(/פתרון:\s*(.+?)(?=\nזמן:|$)/s);
  const timeMatch = content.match(/זמן:\s*(O\([^)]+\))/);
  const spaceMatch = content.match(/מקום:\s*(O\([^)]+\))/);

  return {
    solution: solutionMatch?.[1]?.trim() || content.trim(),
    timeComplexity: timeMatch?.[1] || "O(?)",
    spaceComplexity: spaceMatch?.[1] || "O(?)",
  };
}

/**
 * Backfill AI summaries for this week's questions
 */
export const backfillWeekSummaries = functions.https.onCall(
  async (): Promise<{updated: number; errors: number}> => {
    const apiKey = process.env.OPENROUTER_API_KEY ||
      functions.config().openrouter?.api_key;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "OpenRouter API key not configured"
      );
    }

    // Get Sunday-Thursday date range for current week
    const now = new Date();
    const dayOfWeek = now.getDay();

    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4);
    thursday.setHours(23, 59, 59, 999);

    console.log(`Backfilling for week: ${sunday.toISOString()} - ${thursday.toISOString()}`);

    // Fetch all retrieved questions
    const snapshot = await db.collection("retrievedQuestions").get();

    let updated = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const question = doc.data() as RetrievedQuestion;

      // Check if within date range
      const sentDate = new Date(question.sentDate);
      if (sentDate < sunday || sentDate > thursday) {
        continue;
      }

      // Skip if already has AI summary
      if (question.aiSummary) {
        console.log(`Skipping ${question.title} - already has summary`);
        continue;
      }

      console.log(`Generating summary for: ${question.title}`);

      try {
        const aiSummary = await generateAISummary(
          {
            title: question.title,
            difficulty: question.difficulty,
            titleSlug: question.titleSlug,
          },
          apiKey
        );

        await doc.ref.update({aiSummary});
        updated++;
        console.log(`Updated: ${question.title}`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${question.title}:`, error);
        errors++;
      }
    }

    console.log(`Backfill complete. Updated: ${updated}, Errors: ${errors}`);
    return {updated, errors};
  }
);
