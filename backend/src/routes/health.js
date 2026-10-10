import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { config } from '../config.js';
import { isSupabaseConfigured } from '../db/supabase.js';

const router = Router();

router.get('/', (req, res) => {
  sendOk(res, {
    status: 'running',
    aiMode: config.aiMode,
    storage: isSupabaseConfigured ? 'supabase' : 'placeholder',
  });
});

export default router;