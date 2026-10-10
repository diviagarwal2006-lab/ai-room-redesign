import { Router } from 'express';
import { sendOk, AppError } from '../utils/response.js';
import { mockDesign } from '../mock/index.js';
import { isSupabaseConfigured } from '../db/supabase.js';
import { getRoom } from '../db/rooms.js';
import { saveDesign, formatDesign } from '../db/designs.js';
import { isUuid } from '../utils/validate.js';

const router = Router();
const MAX_INSTRUCTION_LENGTH = 500;

router.post('/', async (req, res, next) => {
  try {
    // req.body can be empty, so we default to {}
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

    // No Supabase keys: keep returning fake data, like in M2
    if (!isSupabaseConfigured) {
      return sendOk(res, mockDesign({ roomId, instruction: cleanInstruction }));
    }

    // Find the stored room
    if (!isUuid(roomId)) {
      throw new AppError(404, 'ROOM_NOT_FOUND', 'No room found with that roomId.');
    }
    const room = await getRoom(roomId);
    if (!room) {
      throw new AppError(404, 'ROOM_NOT_FOUND', 'No room found with that roomId.');
    }

    // Pick which uploaded photo is the "original" (default: the first one)
    const index = photoIndex ?? 0;
    if (!Number.isInteger(index) || index < 0 || index >= room.photos.length) {
      throw new AppError(
        400,
        'INVALID_PHOTO_INDEX',
        `photoIndex must be a whole number from 0 to ${room.photos.length - 1}.`
      );
    }

    // Still fake: the modifications and the result image (real AI comes later)
    const fake = mockDesign({ roomId, instruction: cleanInstruction });

    const design = await saveDesign({
      roomId,
      instruction: cleanInstruction,
      modifications: fake.modifications,
      originalImageUrl: room.photos[index].url,
      resultImageUrl: fake.resultImageUrl,
    });

    sendOk(res, formatDesign(design, room));
  } catch (err) {
    next(err);
  }
});

export default router;