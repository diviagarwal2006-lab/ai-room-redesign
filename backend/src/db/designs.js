import { supabase } from './supabase.js';
import { AppError } from '../utils/response.js';

// Saves a design and returns the saved row (it includes the new id)
export async function saveDesign({ roomId, instruction, modifications, originalImageUrl, resultImageUrl }) {
  const { data, error } = await supabase
    .from('designs')
    .insert({
      room_id: roomId,
      instruction,
      modifications,
      original_image_url: originalImageUrl,
      result_image_url: resultImageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert failed:', error.message);
    throw new AppError(500, 'DATABASE_FAILED', 'Could not save the design. Please try again.');
  }
  return data;
}

// Loads one design by id. Returns the row, or null if there is no such design.
export async function getDesign(id) {
  const { data, error } = await supabase.from('designs').select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('Supabase read failed:', error.message);
    throw new AppError(500, 'DATABASE_FAILED', 'Could not load the design. Please try again.');
  }
  return data;
}

// Turns database rows (snake_case) into the shape from contracts/API.md (camelCase)
export function formatDesign(design, room) {
  return {
    designId: design.id,
    status: design.status,
    roomId: design.room_id,
    instruction: design.instruction,
    modifications: design.modifications,
    originalImageUrl: design.original_image_url,
    resultImageUrl: design.result_image_url,
    room: room.analysis,
    mock: true, // the modifications and result image are still fake until the AI milestones
    createdAt: design.created_at,
  };
}