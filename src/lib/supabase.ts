
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Initialize Supabase client
const supabaseUrl = 'https://mpritiukpafylktqdxhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcml0aXVrcGFmeWxrdHFkeGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NjQ3MTIsImV4cCI6MjA2MDM0MDcxMn0.EzMkc50NfeDYeh7aS-WsYNUfEgpeZJGKjCvTvwzIEy0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
