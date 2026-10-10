import app from './app.js';
import { config } from './config.js';
import { isSupabaseConfigured } from './db/supabase.js';
import { isRealAi } from './ai/gemini.js';

app.listen(config.port, (error) => {
  if (error) {
    console.error('Could not start the server:', error.message);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${config.port} (AI mode: ${config.aiMode})`);
  console.log(`Storage: ${isSupabaseConfigured ? 'Supabase' : 'placeholder (no Supabase keys in .env)'}`);
  console.log(`AI: ${isRealAi ? `Gemini (${config.geminiTextModel})` : 'mock'}`);
  if (config.aiMode === 'real' && !config.geminiApiKey) {
    console.warn('AI_MODE=real but GEMINI_API_KEY is empty, so the AI stays in mock mode.');
  }
});