
let geminiClientPromise;

async function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend .env");
  }

  if (!geminiClientPromise) {
    geminiClientPromise = import("@google/genai").then(
      ({ GoogleGenAI }) => {
        return new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });
      }
    );
  }

  return geminiClientPromise;
}

module.exports = getGeminiClient;
