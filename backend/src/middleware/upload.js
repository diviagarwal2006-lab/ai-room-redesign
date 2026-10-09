import multer from 'multer';
import { AppError } from '../utils/response.js';
import { detectImageType } from '../utils/imageType.js';

export const MIN_PHOTOS = 2;
export const MAX_PHOTOS = 4;
export const MAX_FILE_MB = 5;

// multer reads the uploaded files and keeps them in memory (req.files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_MB * 1024 * 1024,
    files: MAX_PHOTOS,
  },
});

// Step 1: receive the files from the field named "photos"
export function uploadPhotos(req, res, next) {
  upload.array('photos', MAX_PHOTOS)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(413, 'FILE_TOO_LARGE', `Each photo must be ${MAX_FILE_MB} MB or smaller.`)
        );
      }
      if (err.code === 'LIMIT_FILE_COUNT' || (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'photos')) {
        return next(
          new AppError(400, 'TOO_MANY_PHOTOS', `You can upload at most ${MAX_PHOTOS} photos.`)
        );
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(400, 'INVALID_FIELD', 'Send the files in a form field named "photos".')
        );
      }
      return next(new AppError(400, 'UPLOAD_ERROR', err.message));
    }
    if (err) return next(err);
    next();
  });
}

// Step 2: check the count and the REAL type of every file
export function validatePhotos(req, res, next) {
  const files = req.files ?? [];

  if (files.length < MIN_PHOTOS) {
    return next(
      new AppError(400, 'TOO_FEW_PHOTOS', `Please upload at least ${MIN_PHOTOS} photos.`)
    );
  }

  for (const file of files) {
    const type = detectImageType(file.buffer);
    if (!type) {
      return next(
        new AppError(400, 'INVALID_FILE_TYPE', `"${file.originalname}" is not a JPG, PNG or WebP image.`)
      );
    }
    file.detectedType = type;
  }

  next();
}