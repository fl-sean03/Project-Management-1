'use client';

import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase';

// Hook for using Supabase in client components
export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const client = createBrowserSupabaseClient();
      setSupabase(client);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { supabase, loading };
} 