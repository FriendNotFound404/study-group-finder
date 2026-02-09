import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_API_KEY;
console.log("[Gemini] API Key:", apiKey ? 'SET' : 'MISSING');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

// Diagnostic function
export async function listAvailableModels() {
  try {
    const models = await genAI.listModels();
    console.log("[Gemini] Available models:", models);
    return models;
  } catch (error) {
    console.error("[Gemini] Error listing models:", error);
    return null;
  }
}

export const geminiService = {
  async generateGroupDescription(subject: string, goal: string) {
    try {
      const result = await model.generateContent(
        `Act as a helpful study group organizer. Create an engaging, professional study group description for a group focused on "${subject}". The primary goal is: "${goal}". Keep it concise and welcoming for university students.`
      );
      return result.response.text();
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate description. Please try writing one manually.";
    }
  },

  async summarizeChat(messages: string[]) {
    try {
      const result = await model.generateContent(
        `Summarize the following study group chat messages into key takeaways and action items:\n\n${messages.join("\n")}`
      );
      return result.response.text();
    } catch {
      return "Summary unavailable at this time.";
    }
  },

  async suggestStudyPlan(subject: string) {
    try {
      const result = await model.generateContent(
        `Create a structured 4-week university study plan for "${subject}" with bullet points and headings.`
      );
      return result.response.text();
    } catch {
      return "Study plan generation failed.";
    }
  },
};

