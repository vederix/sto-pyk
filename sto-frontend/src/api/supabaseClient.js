import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://glxnrnznboejcdknosgd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdseG5ybnpuYm9lamNka25vc2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1ODE3MzMsImV4cCI6MjEwOTE1NzczM30.6-mbxgPUQCAdjIfWI0i2MxZVGTIGfcWH4n7DHJkcOI4';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
