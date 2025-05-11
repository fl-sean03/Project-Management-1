import { getSupabaseClient } from './supabase-client';
import type { Project } from '@/lib/types';
import { PostgrestError } from '@supabase/supabase-js';

// Project service methods
export const projectService = {
  /**
   * Get all projects for the authenticated user
   */
  async getAllProjects() {
    const supabase = getSupabaseClient();
    return await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
  },
  
  /**
   * Get a specific project by ID
   */
  async getProjectById(id: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
  },
  
  /**
   * Search projects with filtering and sorting
   */
  async searchProjects(searchQuery = '', statusFilter = 'all', sortBy = 'newest') {
    const supabase = getSupabaseClient();
    
    try {
      // Check authentication state
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        return { data: [], error: new Error("Authentication required") };
      }
      
      // Start building the query - only fetch projects owned by user
      let query = supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId);
      
      // Add search filter if provided
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Add sorting based on sortBy parameter
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        case 'due-soon':
          query = query.order('due_date', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      const result = await query;
      
      // Transform the data if needed
      if (result.data) {
        result.data = result.data.map(project => ({
          ...project,
          team: project.team || []
        }));
      }
      
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  },

  /**
   * Get project team members
   */
  async getProjectMembers(projectId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('project_members')
      .select('user_id, role')
      .eq('project_id', projectId);
  },
  
  /**
   * Add a team member to a project
   */
  async addProjectMember(projectId: string, userId: string, role: string = 'member') {
    const supabase = getSupabaseClient();
    return await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: userId,
        role: role,
        joined_at: new Date().toISOString()
      }]);
  },
  
  /**
   * Create a new project
   */
  async createProject(projectData: Partial<Project>) {
    const supabase = getSupabaseClient();
    
    try {
      // Check auth before proceeding
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!authData?.user?.id) {
        throw new Error("You must be logged in to create a project");
      }
      
      // Use the authenticated user's ID
      const userId = authData.user.id;
      
      // Create a copy of the data without the team field
      const { team, ...projectDataWithoutTeam } = projectData;
      
      // Set the owner_id explicitly
      const now = new Date().toISOString();
      
      const result = await supabase
        .from('projects')
        .insert([{
          ...projectDataWithoutTeam,
          owner_id: userId,
          created_at: now,
          status: projectData.status || 'Not Started',
          progress: projectData.progress || 0
        }])
        .select();
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Update a project
   */
  async updateProject(projectId: string, updates: Partial<Project>) {
    const supabase = getSupabaseClient();
    
    try {
      // Create a copy of the updates without the team field if it exists
      const { team, ...updatesWithoutTeam } = updates;
      
      const result = await supabase
        .from('projects')
        .update({
          ...updatesWithoutTeam,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select();
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Delete a project
   */
  async deleteProject(projectId: string) {
    const supabase = getSupabaseClient();
    
    try {
      // Check the user is the owner before deleting
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        throw new Error("You must be logged in to delete a project");
      }
      
      // Verify ownership
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();
      
      if (!project || project.owner_id !== userId) {
        throw new Error("You do not have permission to delete this project");
      }
      
      // Delete the project
      const result = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  }
}; 