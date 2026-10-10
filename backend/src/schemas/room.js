import { z } from 'zod';

export const FURNITURE_TYPES = [
  'bed', 'sofa', 'chair', 'table', 'desk', 'wardrobe',
  'shelf', 'tv', 'lamp', 'plant', 'rug', 'curtain', 'other',
];
const WALLS = ['north', 'south', 'east', 'west'];

// Lenient pieces: a bad value is replaced by a safe default instead of failing
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).catch('#CCCCCC');
const confidence = z.number().min(0).max(1).catch(0.5);

// Strict pieces: a bad value fails the whole answer, and we ask the AI again
const fraction = z.number().min(0).max(1);
const meters = z.number().positive().max(20);

const openingSchema = z.object({
  wall: z.enum(WALLS),
  widthM: meters,
  heightM: meters,
});

export const roomSchema = z.object({
  roomType: z.string().min(1),
  roomTypeConfidence: confidence,
  dimensions: z.object({ widthM: meters, lengthM: meters, heightM: meters }),
  walls: z.object({ color: hexColor, colorName: z.string() }),
  floor: z.object({ material: z.string(), color: hexColor }),
  windows: z.array(openingSchema).max(10).default([]),
  doors: z.array(openingSchema).max(10).default([]),
  furniture: z
    .array(
      z.object({
        type: z.enum(FURNITURE_TYPES).catch('other'),
        color: hexColor,
        position: z.object({ x: fraction, z: fraction }),
        sizeM: z.object({ w: meters, d: meters, h: meters }),
        confidence,
      })
    )
    .max(20)
    .default([]),
  dominantColors: z.array(hexColor).max(6).default([]),
  uncertainties: z.array(z.string()).max(10).default([]),
});

// Adds the fields WE control (ids, isEstimate) so the AI cannot get them wrong
export function finalizeRoom(parsed) {
  return {
    ...parsed,
    dimensions: { ...parsed.dimensions, isEstimate: true },
    furniture: parsed.furniture.map((item, index) => ({ id: `f${index + 1}`, ...item })),
  };
}