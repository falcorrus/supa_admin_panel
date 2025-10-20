// =================================================================================
// IMPORTANT: CONFIGURATION REQUIRED
// =================================================================================
// This project now uses environment variables for configuration.
// Please set the following environment variables in your deployment platform:
// - VITE_SUPABASE_URL: Your Supabase project URL
// - VITE_SUPABASE_ANON_KEY: Your Supabase anon key
// =================================================================================

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development fallback - DO NOT use in production, only for local testing
if (process.env.NODE_ENV !== 'production') {
  if (!supabaseUrl) {
    console.warn('VITE_SUPABASE_URL is not set. Using fallback value.');
    // Не используем жёстко заданные значения, это только для отладки
  }
  if (!supabaseAnonKey) {
    console.warn('VITE_SUPABASE_ANON_KEY is not set. Using fallback value.');
  }
}

// Check if environment variables are properly set
if (!supabaseUrl) {
  console.error('FATAL ERROR: VITE_SUPABASE_URL is not set. Please configure your environment variables.');
  supabaseUrl = 'MISSING_CONFIG';
}
if (!supabaseAnonKey) {
  console.error('FATAL ERROR: VITE_SUPABASE_ANON_KEY is not set. Please configure your environment variables.');
  supabaseAnonKey = 'MISSING_CONFIG';
}

export { supabaseUrl, supabaseAnonKey };
