import { gemini } from './gemini.js';
import { config } from '../config.js';
import { ROOM_ANALYSIS_PROMPT } from './prompts.js';
import { roomSchema, finalizeRoom } from '../schemas/room.js';
import { AppError } from '../utils/response.js';

// Keep the request under Gemini's size limit for photos sent inside the request
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 60_000;

// Takes photos in order until the size budget is used up (always at least one)
function pickPhotos(files) {
  const picked = [];
  let total = 0;
  for (const file of files) {
    if (picked.length > 0 && total + file.size > MAX_TOTAL_BYTES) break;
    picked.push(file);
    total += file.size;
  }
  return picked;
}

// Stops waiting if the AI takes too long
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new AppError(504, 'AI_TIMEOUT', 'The AI took too long. Please try again.')),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function askGemini(photoParts, extraNote) {
  const response = await withTimeout(
    gemini.models.generateContent({
      model: config.geminiTextModel,
      contents: [
        ...photoParts,
        { text: extraNote ? `${ROOM_ANALYSIS_PROMPT}\n\n${extraNote}` : ROOM_ANALYSIS_PROMPT },
      ],
      config: { responseMimeType: 'application/json' },
    }),
    TIMEOUT_MS
  );
  return response.text;
}

// Turns the AI's text into a checked room object, or explains what was wrong
function checkReply(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'The reply was not valid JSON.' };
  }

  const result = roomSchema.safeParse(data);
  if (!result.success) {
    const problems = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return { error: `The JSON did not match the format. Problems: ${problems}` };
  }
  return { room: finalizeRoom(result.data) };
}

// Pipeline A: photos in, validated room JSON out
export async function analyzeRoomPhotos(files) {
  const photoParts = pickPhotos(files).map((file) => ({
    inlineData: { mimeType: file.detectedType, data: file.buffer.toString('base64') },
  }));

  let note = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    let text;
    try {
      text = await askGemini(photoParts, note);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Gemini request failed:', error.message); // details only in YOUR terminal
      throw new AppError(
        502,
        'AI_FAILED',
        'The AI service could not analyze the room. Please try again in a minute.'
      );
    }

    const checked = checkReply(text);
    if (checked.room) return checked.room;

    console.error(`Room analysis attempt ${attempt} was invalid:`, checked.error);
    note = `Your previous answer was rejected. ${checked.error} Return corrected JSON only.`;
  }

  throw new AppError(502, 'AI_FAILED', 'The AI gave an unusable answer. Please try again.');
}