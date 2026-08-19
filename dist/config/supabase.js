"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || 'https://gjavcmvnrckfhxesawas.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_uCjlIlzIrpZFWVWwFeu_1w_izVWi04B';
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
