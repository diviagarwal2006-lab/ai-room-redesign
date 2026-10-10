import { supabase } from './supabase.js';
import { AppError } from '../utils/response.js';

// Saves one room (its photos and its analysis) as a row in the "rooms" table
export async function saveRoom({ id, photos, analysis }) {
  const { error } = await supabase.from('rooms').insert({ id, photos, analysis });

  if (error) {
    console.error('Supabase insert failed:', error.message); // details only in YOUR terminal
    throw new AppError(500, 'DATABASE_FAILED', 'Could not save the room. Please try again.');
  }
}