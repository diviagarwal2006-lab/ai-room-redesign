import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { mockAnalyzeRoom } from '../mock/index.js';
import { uploadPhotos, validatePhotos } from '../middleware/upload.js';
import { isSupabaseConfigured } from '../db/supabase.js';
import { uploadPhoto } from '../db/storage.js';
import { saveRoom } from '../db/rooms.js';

const router = Router();

// M4: photos are stored for real (when Supabase is configured).
// The room analysis is still fake (real AI comes later).
router.post('/', uploadPhotos, validatePhotos, async (req, res, next) => {
  try {
    const result = mockAnalyzeRoom();

    if (isSupabaseConfigured) {
      const roomId = randomUUID();

      // Upload all photos at the same time
      const photos = await Promise.all(
        req.files.map(async (file, index) => ({
          index,
          url: await uploadPhoto(roomId, file, index),
          name: file.originalname,
          mimeType: file.detectedType,
          sizeBytes: file.size,
        }))
      );

      await saveRoom({ id: roomId, photos, analysis: result.room });

      result.roomId = roomId;
      result.photos = photos;
    } else {
      // No Supabase keys: keep placeholder URLs so the server still works
      result.photos = req.files.map((file, index) => ({
        index,
        url: `https://placehold.co/800x600?text=Room+Photo+${index + 1}`,
        name: file.originalname,
        mimeType: file.detectedType,
        sizeBytes: file.size,
      }));
    }

    sendOk(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;