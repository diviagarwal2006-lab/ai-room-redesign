import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { mockAnalyzeRoom } from '../mock/index.js';

const router = Router();

// M2: always fake data. Real uploads come in M3, real AI in M6.
router.post('/', (req, res) => {
  sendOk(res, mockAnalyzeRoom());
});

export default router;