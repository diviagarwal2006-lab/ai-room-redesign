import app from './app.js';
import { config } from './config.js';
import { isSupabaseConfigured } from './db/supabase.js';

app.listen(config.port, (error) => {
  if (error) {
    console.error('Could not start the server:', error.message);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${config.port} (AI mode: ${config.aiMode})`);
  console.log(`Storage: ${isSupabaseConfigured ? 'Supabase' : 'placeholder (no Supabase keys in .env)'}`);
});