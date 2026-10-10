import 'dotenv/config';

export const config = {
  port: process.env.PORT || 5000,
  aiMode: process.env.AI_MODE || 'mock',
  // Allowed frontend addresses, separated by commas in .env
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || '',
  storageBucket: process.env.SUPABASE_BUCKET || 'room-photos',
};