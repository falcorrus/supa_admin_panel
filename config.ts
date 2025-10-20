// =================================================================================
// IMPORTANT: CONFIGURATION REQUIRED
// =================================================================================
// This project now uses environment variables for configuration.
// Please set the following environment variables in your deployment platform:
// - VITE_SUPABASE_URL: Your Supabase project URL
// - VITE_SUPABASE_ANON_KEY: Your Supabase anon key
// =================================================================================

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
