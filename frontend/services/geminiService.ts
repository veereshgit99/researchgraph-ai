
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this context, we'll proceed, but API calls will fail without a key.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are a world-class AI/ML research assistant named 'Explorer AI'. 
Your purpose is to help users understand and explore the landscape of artificial intelligence research. 
You can summarize papers, explain complex concepts, compare methods, and suggest related work. 
Your answers should be clear, concise, and accurate. 
When asked for recommendations, provide relevant and diverse examples. 
Format your responses using markdown for readability, including lists, bold text, and code blocks where appropriate.`;

export const generateAssistantResponse = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...history, { role: 'user', parts: [{ text: newMessage }] }],
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating response from Gemini API:", error);
    return "I'm sorry, but I encountered an error while processing your request. Please check the console for more details and ensure your API key is configured correctly.";
  }
};
