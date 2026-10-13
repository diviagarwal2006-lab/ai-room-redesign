import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

// Real AI only when AI_MODE=real AND a key exists. Otherwise the server stays in mock mode.
export const isRealAi = config.aiMode === 'real' && Boolean(config.geminiApiKey);

const client = isRealAi ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Errors that usually go away by themselves (Google is busy)
function isBusyError(error) {
  const text = `${error?.status ?? ''} ${error?.message ?? ''}`;
  return /\b(429|500|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(text);
}

// Tries the main model, then each backup model. Busy errors get one retry.
async function generateWithFallback(params) {
  const models = [params.model, ...config.geminiFallbackModels].filter(
    (model, index, list) => model && list.indexOf(model) === index
  );

  let lastError;
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await client.models.generateContent({ ...params, model });
      } catch (error) {
        lastError = error;
        const busy = isBusyError(error);
        console.warn(
          `Gemini ${model} failed (attempt ${attempt}, ${busy ? 'busy' : 'error'}): ${String(error.message).slice(0, 150)}`
        );
        if (!busy) break; // a real error (for example a wrong model name): try the next model
        await sleep(1500 * attempt);
      }
    }
  }
  throw lastError;
}

// The rest of the code calls gemini.models.generateContent(...) exactly as before
export const gemini = isRealAi ? { models: { generateContent: generateWithFallback } } : null;