import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_API_KEY;
console.log("[Gemini] API Key:", apiKey ? 'SET' : 'MISSING');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

export const geminiService = {
  async generateGroupDescription(subject: string, goal: string) {
    try {
      const result = await model.generateContent(
        `Create a single, concise study group description (2-3 sentences max) for a group focused on "${subject}".
        Primary goal: "${goal}".

        Requirements:
        - Write in plain text without special formatting, markdown, or asterisks
        - Keep it welcoming and professional for university students
        - Focus on what members will do and achieve together
        - Do NOT include multiple options or variations
        - Maximum 150 words`
      );
      return result.response.text();
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate description. Please try writing one manually.";
    }
  },

  async summarizeChat(messages: string[]) {
    try {
      console.log("[Gemini] Summarizing", messages.length, "messages");

      if (!apiKey) {
        console.error("[Gemini] API Key is missing");
        return "API key is not configured. Please check your .env file.";
      }

      if (messages.length === 0) {
        return "No messages to summarize.";
      }

      const prompt = `Analyze these study group chat messages and create a brief summary.

Messages:
${messages.join("\n")}

Format your response EXACTLY as follows (use plain text, no markdown, no asterisks):

Key Takeaways:
- [Point 1]
- [Point 2]
- [Point 3]

Action Items:
- [Action 1 with any relevant details like date/time/location]
- [Action 2 with any relevant details like date/time/location]

Keep it concise and clear. Maximum 5 bullet points total.`;
      console.log("[Gemini] Sending prompt to API...");

      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      console.log("[Gemini] Summary generated successfully");
      return summary;
    } catch (error: any) {
      console.error("[Gemini] Summarization Error:", error);
      console.error("[Gemini] Error details:", error.message || error);

      // Return more specific error messages
      if (error.message?.includes('API key')) {
        return "API key error. Please check your Gemini API configuration.";
      } else if (error.message?.includes('quota')) {
        return "API quota exceeded. Please try again later.";
      } else if (error.message?.includes('blocked')) {
        return "Content was blocked by safety filters.";
      }

      return `Summary unavailable: ${error.message || 'Unknown error'}`;
    }
  },

  async suggestStudyPlan(subject: string) {
    try {
      const result = await model.generateContent(
        `Create a clear, organized 4-week study plan for "${subject}".

Format requirements:
- Use plain text with simple headings (Week 1:, Week 2:, etc.)
- Use bullet points (-) for topics and tasks
- No markdown formatting, bold, italics, or asterisks
- Keep each week's plan to 4-5 bullet points maximum
- Be specific about topics to cover and activities to complete
- Total length: maximum 300 words

Example format:
Week 1: [Theme]
- Topic or activity
- Topic or activity

Week 2: [Theme]
- Topic or activity
- Topic or activity`
      );
      return result.response.text();
    } catch {
      return "Study plan generation failed.";
    }
  },
};

