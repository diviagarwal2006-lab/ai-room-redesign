import { Router } from 'express';
import { sendOk, AppError } from '../utils/response.js';
import { mockDesign } from '../mock/index.js';

const router = Router();
const MAX_INSTRUCTION_LENGTH = 500;

router.post('/', (req, res) => {
  // req.body can be empty, so we default to {}
  const { roomId, instruction } = req.body ?? {};

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

  sendOk(res, mockDesign({ roomId, instruction: instruction.trim() }));
});

export default router;