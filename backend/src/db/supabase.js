import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// true only when both the URL and the secret key are filled in .env
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseSecretKey);

// null when not configured, so the rest of the code can fall back to placeholders
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { persistSession: false },
    })
  : null;