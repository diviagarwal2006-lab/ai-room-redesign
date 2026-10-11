import sharp from 'sharp';
import { AppError } from '../utils/response.js';

const MAX_SIDE = 1600; // the longest side after resizing, in pixels
const MIN_SIDE = 320; // the shortest side must be at least this
const MAX_INPUT_PIXELS = 50_000_000; // refuse giant images (protects server memory)

// Cleans ONE photo: fixes rotation, shrinks it, converts to JPEG, removes hidden metadata
async function normalizePhoto(file) {
  try {
    const image = sharp(file.buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    const { width, height } = await image.metadata();

    if (Math.min(width, height) < MIN_SIDE) {
      throw new AppError(
        400,
        'IMAGE_TOO_SMALL',
        `"${file.originalname}" is too small. Photos must be at least ${MIN_SIDE} pixels on each side.`
      );
    }

    const { data, info } = await image
      .rotate() // apply the camera's rotation, then forget it
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // transparent areas of a PNG become white
      .jpeg({ quality: 85 }) // metadata (including GPS) is dropped by default
      .toBuffer({ resolveWithObject: true });

    file.originalSize = file.size; // keep the original size (the demo match uses it)
    file.buffer = data;
    file.size = info.size;
    file.detectedType = 'image/jpeg';
    file.width = info.width;
    file.height = info.height;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Image processing failed:', error.message); // details only in YOUR terminal
    throw new AppError(
      400,
      'INVALID_FILE_TYPE',
      `"${file.originalname}" could not be read as a photo (it may be damaged or extremely large).`
    );
  }
}

// Step 3: clean every photo, one after another (keeps memory use low)
export async function processPhotos(req, res, next) {
  try {
    for (const file of req.files) {
      await normalizePhoto(file);
    }
    next();
  } catch (error) {
    next(error);
  }
}