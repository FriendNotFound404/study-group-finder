
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  async generateGroupDescription(subject: string, goal: string) {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it uses the current process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Act as a helpful study group organizer. Create an engaging, professional study group description for a group focused on "${subject}". The primary goal is: "${goal}". Keep it concise and welcoming for university students.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate description. Please try writing one manually.";
    }
  },

  async summarizeChat(messages: string[]) {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it uses the current process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const chatContext = messages.join("\n");
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Summarize the following study group chat messages into key takeaways and action items for the members:\n\n${chatContext}`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Summary unavailable at this time.";
    }
  },

  async suggestStudyPlan(subject: string) {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it uses the current process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      // Use gemini-1.5-pro for complex reasoning tasks like curriculum planning
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: `Create a highly structured 4-week study plan for university students studying "${subject}". Focus on breaking down complex topics into manageable weekly goals. Use bullet points and clear headings.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Study plan generation failed.";
    }
  }
};
