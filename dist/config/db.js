"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const supabase_1 = require("./supabase");
const connectDB = async () => {
    try {
        console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL || 'https://gjavcmvnrckfhxesawas.supabase.co'}`);
        const { error } = await supabase_1.supabase.from('users').select('id').limit(1);
        if (error) {
            console.error('Supabase connection warning:', error.message);
            return;
        }
        console.log('Supabase connected successfully.');
    }
    catch (error) {
        console.error('Supabase connection error:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
