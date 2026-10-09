import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { mockAnalyzeRoom } from '../mock/index.js';
import { uploadPhotos, validatePhotos } from '../middleware/upload.js';

const router = Router();

// M3: photos are real and validated. The room analysis is still fake (real AI comes in M6).
router.post('/', uploadPhotos, validatePhotos, (req, res) => {
  const result = mockAnalyzeRoom();

  // Replace the fake photo list with info about the files we really received.
  // The url is still a placeholder until we store the photos in M4.
  result.photos = req.files.map((file, index) => ({
    index,
    url: `https://placehold.co/800x600?text=Room+Photo+${index + 1}`,
    name: file.originalname,
    mimeType: file.detectedType,
    sizeBytes: file.size,
  }));

  sendOk(res, result);
});

export default router;