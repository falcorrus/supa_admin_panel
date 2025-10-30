// =================================================================================
// IMPORTANT: CONFIGURATION REQUIRED
// =================================================================================
// This project now uses environment variables for configuration.
// Please set the following environment variables in your deployment platform:
// - VITE_SUPABASE_URL: Your Supabase project URL
// - VITE_SUPABASE_ANON_KEY: Your Supabase anon key
// =================================================================================

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_ANON_KEY from config.ts:', supabaseAnonKey);

if (!supabaseUrl) {
  throw new Error('FATAL ERROR: VITE_SUPABASE_URL is not set. Please configure your environment variables.');
}
if (!supabaseAnonKey) {
  throw new Error('FATAL ERROR: VITE_SUPABASE_ANON_KEY is not set. Please configure your environment variables.');
}

export { supabaseUrl, supabaseAnonKey };