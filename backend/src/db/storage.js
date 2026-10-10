import { supabase } from './supabase.js';
import { config } from '../config.js';
import { AppError } from '../utils/response.js';

// We pick the file extension from the REAL detected type, never from the user's file name
const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Uploads one photo to the bucket and returns its public URL
export async function uploadPhoto(roomId, file, index) {
  const extension = EXTENSIONS[file.detectedType];
  const filePath = `${roomId}/original-${index}.${extension}`;

  const { error } = await supabase.storage
    .from(config.storageBucket)
    .upload(filePath, file.buffer, { contentType: file.detectedType });

  if (error) {
    console.error('Supabase upload failed:', error.message); // details only in YOUR terminal
    throw new AppError(500, 'STORAGE_FAILED', 'Could not save the photo. Please try again.');
  }

  const { data } = supabase.storage.from(config.storageBucket).getPublicUrl(filePath);
  return data.publicUrl;
}