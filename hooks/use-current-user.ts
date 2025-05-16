import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/services/supabase-client';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching current user:', error);
          setCurrentUser(null);
        } else if (data?.user) {
          setCurrentUser({
            id: data.user.id,
            // Add other user properties as needed
          });
        }
      } catch (err) {
        console.error('Failed to get current user', err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return currentUser;
} 