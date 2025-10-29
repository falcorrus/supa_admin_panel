import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../config';

let supabaseClient: any;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'MISSING_CONFIG' && supabaseAnonKey !== 'MISSING_CONFIG') {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      throw new Error("Supabase credentials are not configured.");
    }
  }
  return supabaseClient;
};
