import { gemini } from './gemini.js';
import { config } from '../config.js';
import { buildInstructionPrompt } from './instructionPrompt.js';
import {
  modificationsSchema,
  finalizeModifications,
  hasAnyChange,
} from '../schemas/modifications.js';
import { AppError } from '../utils/response.js';
import { withTimeout } from '../utils/withTimeout.js';

const TIMEOUT_MS = 30_000;

async function askGemini(prompt) {
  const response = await withTimeout(
    gemini.models.generateContent({
      model: config.geminiTextModel,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    }),
    TIMEOUT_MS
  );
  return response.text;
}

// Turns the AI's text into checked modifications, or explains what was wrong
function checkReply(text, room) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'The reply was not valid JSON.' };
  }

  const result = modificationsSchema.safeParse(data);
  if (!result.success) {
    const problems = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return { error: `The JSON did not match the format. Problems: ${problems}` };
  }
  return { modifications: finalizeModifications(result.data, room) };
}

// Pipeline B: the user's sentence in, validated modifications JSON out
export async function parseInstruction(room, instruction) {
  const basePrompt = buildInstructionPrompt(room, instruction);
  let note = '';

  for (let attempt = 1; attempt <= 2; attempt++) {
    let text;
    try {
      text = await askGemini(note ? `${basePrompt}\n\n${note}` : basePrompt);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Gemini request failed:', error.message); // details only in YOUR terminal
      throw new AppError(
        502,
        'AI_FAILED',
        'The AI service could not read your request. Please try again in a minute.'
      );
    }

    const checked = checkReply(text, room);
    if (checked.modifications) {
      if (!hasAnyChange(checked.modifications)) {
        throw new AppError(
          422,
          'INSTRUCTION_UNCLEAR',
          'I could not find a design change in that. Try something like "make the walls light blue and add plants".'
        );
      }
      return checked.modifications;
    }

    console.error(`Instruction parsing attempt ${attempt} was invalid:`, checked.error);
    note = `Your previous answer was rejected. ${checked.error} Return corrected JSON only.`;
  }

  throw new AppError(502, 'AI_FAILED', 'The AI gave an unusable answer. Please try again.');
}