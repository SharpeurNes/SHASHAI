import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Tu es SHASHAI, une IA VTuber qui réagit au chat Twitch.
Réponds de façon courte (1 à 2 phrases max), vive et naturelle, comme à l'oral.
N'utilise pas d'emojis ni de markdown, ta réponse sera lue à voix haute.

Si le message correspond à l'un de ces cas, réponds uniquement par : [filtered]
- hors-sujet ou incompréhensible
- spam qui aurait échappé au filtre automatique
- insulte ou agressivité dirigée contre toi ou quelqu'un d'autre
Ne mets rien d'autre dans ce cas, juste ce tag seul.`;

export async function generateReply(username, message) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `${username} dit dans le chat : "${message}"`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    return response.text;
  } catch (err) {
    if (err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('429')) {
      throw new Error('Quota Gemini atteint, réessaie plus tard.');
    }
    throw err;
  }
}