import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/services/supabase-client';
import { useCurrentUser } from './use-current-user';

export function useProjectMember(projectId: string) {
  const [memberData, setMemberData] = useState<{ role: string | null }>({ role: null });
  const [loading, setLoading] = useState(true);
  const currentUser = useCurrentUser();

  useEffect(() => {
    const fetchMemberRole = async () => {
      if (!currentUser?.id || !projectId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', currentUser.id)
          .single();

        if (error) {
          console.error('Error fetching project member role:', error);
          setMemberData({ role: null });
        } else if (data) {
          setMemberData({ role: data.role });
        }
      } catch (err) {
        console.error('Failed to get project member role', err);
        setMemberData({ role: null });
      } finally {
        setLoading(false);
      }
    };

    fetchMemberRole();
  }, [projectId, currentUser?.id]);

  return { ...memberData, loading };
} 