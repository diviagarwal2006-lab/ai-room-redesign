import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { mockDesign } from '../mock/index.js';

const router = Router();

// :id is a placeholder. /api/design/abc123 gives req.params.id = "abc123"
router.get('/:id', (req, res) => {
  sendOk(res, mockDesign({ designId: req.params.id }));
});

export default router;