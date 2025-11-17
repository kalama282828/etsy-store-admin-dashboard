

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your project's Supabase URL and Anon Key.
// You can get these from your Supabase project settings.
export const supabaseUrl = 'https://hwukwjitrnzmlglaukmg.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dWt3aml0cm56bWxnbGF1a21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDQ3MzAsImV4cCI6MjA3ODg4MDczMH0.PuuhbzOLfESQ8mzxQCCOEBI4aFZRTaGfAtwcTIeBwqM';

// A console.warn is better than throwing an error for a demo app,
// so the app can still render. We'll show a proper UI warning in App.tsx.
if (supabaseUrl.includes('your-project-url')) {
    console.warn(`Supabase bilgileri ayarlanmadı. Lütfen 'lib/supabase.ts' dosyasını güncelleyin.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);