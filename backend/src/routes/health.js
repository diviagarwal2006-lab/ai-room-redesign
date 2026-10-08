import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

router.get('/', (req, res) => {
  sendOk(res, { status: 'running', aiMode: config.aiMode });
});

export default router;