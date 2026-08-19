import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gjavcmvnrckfhxesawas.supabase.co';
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_uCjlIlzIrpZFWVWwFeu_1w_izVWi04B';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});