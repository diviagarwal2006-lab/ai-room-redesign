import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(here, '../../demo/demo-results.json');
const NOT_AVAILABLE_URL =
  'https://placehold.co/800x600?text=Demo+image+not+available+for+this+room';

// Read the list of prepared images once, when the server starts
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
  : { rooms: [] };

// Returns the web address of the best prepared "after" image
export function pickDemoImage(room, photoIndex, modifications, instruction) {
  const photo = room.photos[photoIndex];

  // Prepared images only fit the demo room (same photo name and size)
  const demoRoom = manifest.rooms.find(
    (entry) => entry.photo.name === photo.name && entry.photo.sizeBytes === photo.sizeBytes
  );
  if (!demoRoom || demoRoom.results.length === 0) return NOT_AVAILABLE_URL;

  // All the words that describe the request
  const text = [
    instruction,
    modifications.summary,
    modifications.style,
    modifications.walls?.colorName,
    modifications.floor?.material,
    ...modifications.addFurniture.map((item) => item.type),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Pick the image whose keywords match the most. No match = the first image.
  let best = demoRoom.results[0];
  let bestScore = 0;
  for (const result of demoRoom.results) {
    const score = result.keywords.filter((word) => text.includes(word)).length;
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }

  return supabase.storage.from(config.storageBucket).getPublicUrl(`demo/${best.file}`).data
    .publicUrl;
}