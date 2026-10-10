import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

// Real AI only when AI_MODE=real AND a key exists. Otherwise the server stays in mock mode.
export const isRealAi = config.aiMode === 'real' && Boolean(config.geminiApiKey);

export const gemini = isRealAi ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;