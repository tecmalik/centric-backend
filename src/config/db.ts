import { supabase } from './supabase';

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL || 'https://gjavcmvnrckfhxesawas.supabase.co'}`);
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection warning:', error.message);
      return;
    }
    console.log('Supabase connected successfully.');
  } catch (error) {
    console.error('Supabase connection error:', error);
    process.exit(1);
  }
};
