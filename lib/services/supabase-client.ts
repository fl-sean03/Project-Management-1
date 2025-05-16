import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase';

// Use a singleton pattern for the Supabase client
let supabaseInstance: SupabaseClient | null = null;

// Initialize Supabase client
export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use the browser client for client-side code to ensure auth state is shared
    supabaseInstance = createBrowserSupabaseClient();
  } else {
    // Fallback to regular client for server-side code
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
} 