import { Router } from 'express';
import { sendOk, AppError } from '../utils/response.js';
import { mockDesign } from '../mock/index.js';
import { isSupabaseConfigured } from '../db/supabase.js';
import { getRoom } from '../db/rooms.js';
import { getDesign, formatDesign } from '../db/designs.js';
import { isUuid } from '../utils/validate.js';

const router = Router();

// :id is a placeholder. /api/design/abc123 gives req.params.id = "abc123"
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // No Supabase keys: keep returning fake data, like in M2
    if (!isSupabaseConfigured) {
      return sendOk(res, mockDesign({ designId: id }));
    }

    if (!isUuid(id)) {
      throw new AppError(404, 'DESIGN_NOT_FOUND', 'No design found with that id.');
    }
    const design = await getDesign(id);
    if (!design) {
      throw new AppError(404, 'DESIGN_NOT_FOUND', 'No design found with that id.');
    }

    const room = await getRoom(design.room_id);
    sendOk(res, formatDesign(design, room));
  } catch (err) {
    next(err);
  }
});

export default router;