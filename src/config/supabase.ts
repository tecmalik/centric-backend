import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gjavcmvnrckfhxesawas.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uCjlIlzIrpZFWVWwFeu_1w_izVWi04B';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
