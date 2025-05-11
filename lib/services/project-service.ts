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
      
      // Get projects the user is a member of
      const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);
        
      if (memberError) {
        console.error('Error fetching member projects:', memberError);
        return { data: [], error: memberError };
      }
      
      // Extract project IDs the user is a member of
      const memberProjectIds = memberProjects?.map(p => p.project_id) || [];
      
      // Build the query to fetch both owned projects and projects the user is a member of
      let query = supabase
        .from('projects')
        .select('*');
        
      // If the user is a member of any projects, include them in the query
      if (memberProjectIds.length > 0) {
        query = query.or(`owner_id.eq.${userId},id.in.(${memberProjectIds.join(',')})`);
      } else {
        // If not a member of any projects, just show owned projects
        query = query.eq('owner_id', userId);
      }
      
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
    const response = await supabase
      .from('project_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        last_active
      `)
      .eq('project_id', projectId);

    // Update last_active for all project members
    if (response.data && response.data.length > 0) {
      const updatePromises = response.data.map(member => {
        return supabase
          .from('project_members')
          .update({ last_active: new Date().toISOString() })
          .eq('id', member.id);
      });
      
      await Promise.all(updatePromises);
    }
    
    return response;
  },
  
  /**
   * Add a team member to a project
   */
  async addProjectMember(projectId: string, userId: string, role: string = 'member') {
    const supabase = getSupabaseClient();
    
    try {
      // First check if this user is already a member of the project
      const { data: existingMember, error: checkError } = await supabase
        .from('project_members')
        .select('id, role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();
      
      // If there was an error other than 'not found', return the error
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing project member:', checkError);
        return { data: null, error: checkError };
      }
      
      // If the user is already a member, don't try to add them again
      if (existingMember) {
        console.log('User is already a member of this project');
        return { data: existingMember, error: null };
      }
      
      // If not already a member, add them
      return await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_id: userId,
          role: role,
          created_at: new Date().toISOString()
        }]);
    } catch (err) {
      console.error('Error adding project member:', err);
      return { data: null, error: err };
    }
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
      
      // Step 1: Create the project
      console.log("Creating project...");
      const { data: projectData1, error: projectError } = await supabase
        .from('projects')
        .insert([{
          ...projectDataWithoutTeam,
          owner_id: userId,
          created_at: now,
          status: projectData.status || 'Not Started',
          progress: projectData.progress || 0
        }])
        .select();
      
      if (projectError) {
        console.error('Error creating project:', projectError);
        return { data: null, error: projectError };
      }
      
      if (!projectData1 || projectData1.length === 0) {
        return { 
          data: null, 
          error: new Error('Project was created but no data was returned') 
        };
      }
      
      const newProject = projectData1[0];
      const projectId = newProject.id;
      
      // Step 2: Make sure the owner is added as a member
      // This replaces the database trigger that was causing duplicate key errors
      console.log(`Adding owner ${userId} to project ${projectId} using direct SQL insertion with conflict handling...`);
      try {
        // Use upsert mode with ON CONFLICT DO NOTHING
        const { error: memberError } = await supabase
          .from('project_members')
          .upsert({
            project_id: projectId,
            user_id: userId,
            role: 'owner',
            created_at: now
          }, { 
            onConflict: 'project_id,user_id',  // Specify conflicting columns
            ignoreDuplicates: true             // Equivalent to DO NOTHING
          });
        
        if (memberError) {
          console.warn('Error adding owner to project (continuing anyway):', memberError);
        } else {
          console.log('Project owner membership added successfully');
        }
      } catch (memberError) {
        // Just log this error, don't fail the entire process since the project was created
        console.warn('Error adding owner to project (continuing anyway):', memberError);
      }
      
      return { data: projectData1, error: null };
    } catch (err) {
      console.error('Unhandled error during project creation:', err);
      return { data: null, error: err };
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
  },

  /**
   * Get a specific project member's role
   */
  async getProjectMemberRole(projectId: string, userId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();
  },

  /**
   * Ensure user is added as a member of a project (used after project creation)
   * This is needed to handle race conditions with database triggers
   */
  async ensureProjectOwnerMembership(projectId: string, userId: string) {
    const supabase = getSupabaseClient();
    
    try {
      // First check if the user is already a member
      const { data, error: checkError } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();
      
      // If there was an error (other than not found), log it
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking project membership:', checkError);
      }
      
      // If the user is already a member, don't do anything
      if (data) {
        console.log('User is already a member of project:', projectId);
        return { success: true };
      }
      
      // Use RPC to ensure the user is added with "ON CONFLICT DO NOTHING"
      // This works even if a trigger or another process tries to add the same user
      const result = await supabase.rpc('safely_add_project_member', {
        p_project_id: projectId,
        p_user_id: userId,
        p_member_role: 'owner'
      });
      
      return { success: !result.error, error: result.error };
    } catch (err) {
      console.error('Error ensuring project membership:', err);
      return { success: false, error: err };
    }
  },
}; 