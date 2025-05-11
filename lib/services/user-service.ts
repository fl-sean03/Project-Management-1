import { getSupabaseClient } from './supabase-client';
import type { User } from '@/lib/types';

// Users service methods
export const userService = {
  /**
   * Get all users
   */
  async getAllUsers() {
    const supabase = getSupabaseClient();
    return await supabase
      .from('users')
      .select('*')
      .order('name');
  },
  
  /**
   * Get a specific user by ID
   */
  async getUserById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, 
        name,
        email,
        avatar,
        role,
        department,
        team,
        location,
        phone,
        bio,
        skills,
        joined_date,
        last_active
      `)
      .eq('id', id)
      .single();
    
    if (data && !error) {
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', id);
    }
    
    return { data, error };
  },
  
  /**
   * Search users by email
   */
  async searchUsersByEmail(email: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('users')
      .select('*')
      .ilike('email', `%${email}%`)
      .order('name')
      .limit(5);
  },
  
  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>) {
    const supabase = getSupabaseClient();
    
    try {
      // Verify the user is updating their own profile
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      
      if (!currentUserId) {
        throw new Error("You must be logged in to update a user profile");
      }
      
      if (userId !== currentUserId) {
        throw new Error("You can only update your own profile");
      }
      
      // Update the profile
      const response = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
      
      if (response.error) {
        throw response.error;
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    const supabase = getSupabaseClient();
    
    try {
      // Get the current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData?.user?.id) {
        return { data: null, error: authError || new Error("Not authenticated") };
      }
      
      // Get the user profile from the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (error) {
        // If user profile isn't found, it might need to be created
        if (error.code === 'PGRST116') { // Not found error code
          return {
            data: {
              id: authData.user.id,
              email: authData.user.email || '',
              name: authData.user.user_metadata?.full_name || '',
              avatar: authData.user.user_metadata?.avatar_url || null,
              role: 'user',
              department: '',
              team: '',
              location: '',
              phone: '',
              joined_date: authData.user.created_at || '',
              bio: ''
            } as User,
            error: null
          };
        }
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
}; 