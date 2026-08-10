import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Tu es SHASHAI, une IA VTuber qui réagit au chat Twitch.
Réponds de façon courte (1 à 2 phrases max), vive et naturelle, comme à l'oral.
N'utilise pas d'emojis ni de markdown, ta réponse sera lue à voix haute.`;

export async function generateReply(username, message) {
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: `${username} dit dans le chat : "${message}"`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  return response.text;
}