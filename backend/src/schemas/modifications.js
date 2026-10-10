import { z } from 'zod';
import { FURNITURE_TYPES } from './room.js';

export const PLACEMENTS = ['corners', 'along_wall', 'center', 'near_window'];
export const LIGHT_TONES = ['warm', 'neutral', 'cool'];

// A wrong wall color is a real mistake, so bad hex values are rejected (and the AI retries)
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const modificationsSchema = z.object({
  style: z.string().min(1).max(40).nullable().default(null),
  walls: z.object({ color: hexColor, colorName: z.string().min(1).max(40) }).nullable().default(null),
  floor: z.object({ material: z.string().min(1).max(40), color: hexColor }).nullable().default(null),
  lighting: z
    .object({
      tone: z.enum(LIGHT_TONES),
      add: z.array(z.string().min(1).max(40)).max(5).default([]),
    })
    .nullable()
    .default(null),
  addFurniture: z
    .array(
      z.object({
        // Small mistakes get a safe default instead of failing everything
        type: z.enum(FURNITURE_TYPES).catch('other'),
        quantity: z.number().int().min(1).max(10).catch(1),
        placement: z.enum(PLACEMENTS).catch('along_wall'),
      })
    )
    .max(10)
    .default([]),
  removeFurniture: z.array(z.string()).max(20).default([]),
  decor: z.array(z.string().min(1).max(40)).max(8).default([]),
  summary: z.string().min(1).max(200),
});

// Keeps only furniture ids that really exist in this room
export function finalizeModifications(parsed, room) {
  const existingIds = new Set((room.furniture ?? []).map((item) => item.id));
  return {
    ...parsed,
    removeFurniture: parsed.removeFurniture.filter((id) => existingIds.has(id)),
  };
}

// true if the user asked for at least one real change
export function hasAnyChange(modifications) {
  return Boolean(
    modifications.style ||
      modifications.walls ||
      modifications.floor ||
      modifications.lighting ||
      modifications.addFurniture.length ||
      modifications.removeFurniture.length ||
      modifications.decor.length
  );
}