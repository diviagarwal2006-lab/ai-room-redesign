import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
for await (const model of await ai.models.list()) {
  const name = model.name.replace('models/', '');
  const canGenerate = !model.supportedActions || model.supportedActions.includes('generateContent');
  if (canGenerate && name.includes('flash') && !/image|tts|live|audio|embed/.test(name)) {
    console.log(name);
  }
}