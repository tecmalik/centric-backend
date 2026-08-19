"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const supabase_1 = require("./supabase");
const connectDB = async () => {
    const url = process.env.SUPABASE_URL || 'https://gjavcmvnrckfhxesawas.supabase.co';
    console.log(`Connecting to Supabase at: ${url}`);
    try {
        const { error } = await supabase_1.supabase.from('users').select('id').limit(1);
        if (error && error.code === 'PGRST106') {
            console.warn('[DB WARNING] Supabase tables not found. Run supabase/migrations/0001_init.sql in the Supabase SQL editor first.');
        }
        else if (error) {
            console.warn('[DB WARNING] Supabase reachable but returned:', error.message);
        }
        else {
            console.log('Supabase connected successfully.');
        }
    }
    catch (error) {
        console.error('Supabase connection error:', error);
    }
};
exports.connectDB = connectDB;
