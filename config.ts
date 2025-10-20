// =================================================================================
// IMPORTANT: CONFIGURATION REQUIRED
// =================================================================================
// This project now uses environment variables for configuration.
// Please set the following environment variables in your deployment platform:
// - VITE_SUPABASE_URL: Your Supabase project URL
// - VITE_SUPABASE_ANON_KEY: Your Supabase anon key
// =================================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
if (!supabaseUrl) {
  console.warn('VITE_SUPABASE_URL is not set. Please configure your environment variables.');
}
if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is not set. Please configure your environment variables.');
}

export { supabaseUrl, supabaseAnonKey };
