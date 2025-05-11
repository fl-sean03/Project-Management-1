import { getSupabaseClient } from './supabase-client';
import type { Activity } from '@/lib/types';

// Activities service methods
export const activityService = {
  /**
   * Get activities for a project
   */
  async getActivitiesByProject(projectId: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('activities')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    // Map DB column names to client-side property names
    if (response.data) {
      response.data = response.data.map(activity => ({
        id: activity.id,
        user: activity.user_id,
        action: activity.action,
        target: activity.target,
        targetId: activity.target_id,
        targetName: activity.target_name,
        project: activity.project_id,
        time: activity.time,
        content: activity.content,
        created_at: activity.created_at,
        // Include the user object from the join
        userDetails: activity.user
      }));
    }
    
    return response;
  },
  
  /**
   * Get a specific activity by ID
   */
  async getActivityById(id: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('activities')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar
        )
      `)
      .eq('id', id)
      .single();
    
    // Map DB column names to client-side property names
    if (response.data) {
      response.data = {
        id: response.data.id,
        user: response.data.user_id,
        action: response.data.action,
        target: response.data.target,
        targetId: response.data.target_id,
        targetName: response.data.target_name,
        project: response.data.project_id,
        time: response.data.time,
        content: response.data.content,
        created_at: response.data.created_at,
        // Include the user object from the join
        userDetails: response.data.user
      };
    }
    
    return response;
  },
  
  /**
   * Record a new activity
   */
  async recordActivity(activityData: {
    action: string;
    target: string;
    target_id: string;
    target_name: string;
    project_id: string;
    content?: string;
  }) {
    const supabase = getSupabaseClient();
    
    try {
      // Get the current user
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!userData?.user?.id) {
        throw new Error("You must be logged in to record an activity");
      }
      
      const now = new Date();
      
      // Create the activity record
      const response = await supabase
        .from('activities')
        .insert([{
          ...activityData,
          user_id: userData.user.id,
          time: now.toISOString(),
          created_at: now.toISOString()
        }])
        .select(`
          *,
          user:user_id (
            id,
            name,
            avatar
          )
        `);
      
      if (response.error) {
        throw response.error;
      }
      
      // Transform the response
      if (response.data && response.data.length > 0) {
        const activity = response.data[0];
        response.data[0] = {
          id: activity.id,
          user: activity.user_id,
          action: activity.action,
          target: activity.target,
          targetId: activity.target_id,
          targetName: activity.target_name,
          project: activity.project_id,
          time: activity.time,
          content: activity.content,
          created_at: activity.created_at,
          userDetails: activity.user
        };
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  }
}; 