import { Router } from 'express';
import { sendOk, AppError } from '../utils/response.js';
import { mockDesign } from '../mock/index.js';
import { isSupabaseConfigured } from '../db/supabase.js';
import { getRoom } from '../db/rooms.js';
import { saveDesign, formatDesign } from '../db/designs.js';
import { isUuid } from '../utils/validate.js';
import { isRealAi } from '../ai/gemini.js';
import { parseInstruction } from '../ai/parseInstruction.js';
import { pickDemoImage } from '../ai/demoImage.js';

const router = Router();
const MAX_INSTRUCTION_LENGTH = 500;

router.post('/', async (req, res, next) => {
  try {
    const { roomId, instruction, photoIndex } = req.body ?? {};

    if (!roomId || typeof roomId !== 'string') {
      throw new AppError(400, 'ROOM_ID_MISSING', 'roomId is required.');
    }
    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      throw new AppError(400, 'INSTRUCTION_MISSING', 'Please describe the changes you want.');
    }
    if (instruction.length > MAX_INSTRUCTION_LENGTH) {
      throw new AppError(
        400,
        'INSTRUCTION_TOO_LONG',
        `Instruction must be ${MAX_INSTRUCTION_LENGTH} characters or fewer.`
      );
    }
    const cleanInstruction = instruction.trim();

    // No Supabase keys: fake data, like in M2
    if (!isSupabaseConfigured) {
      return sendOk(res, mockDesign({ roomId, instruction: cleanInstruction }));
    }

    if (!isUuid(roomId)) {
      throw new AppError(404, 'ROOM_NOT_FOUND', 'No room found with that roomId.');
    }
    const room = await getRoom(roomId);
    if (!room) {
      throw new AppError(404, 'ROOM_NOT_FOUND', 'No room found with that roomId.');
    }

    const index = photoIndex ?? 0;
    if (!Number.isInteger(index) || index < 0 || index >= room.photos.length) {
      throw new AppError(
        400,
        'INVALID_PHOTO_INDEX',
        `photoIndex must be a whole number from 0 to ${room.photos.length - 1}.`
      );
    }

    // Pipeline B: real AI understands the sentence
    const fake = mockDesign({ roomId, instruction: cleanInstruction });
    const modifications = isRealAi
      ? await parseInstruction(room.analysis, cleanInstruction)
      : fake.modifications;

    // Pipeline C: a prepared "after" image
    const resultImageUrl = pickDemoImage(room, index, modifications, cleanInstruction);

    const design = await saveDesign({
      roomId,
      instruction: cleanInstruction,
      modifications,
      originalImageUrl: room.photos[index].url,
      resultImageUrl,
    });

    sendOk(res, formatDesign(design, room));
  } catch (err) {
    next(err);
  }
});

export default router;