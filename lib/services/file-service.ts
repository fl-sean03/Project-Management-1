import { getSupabaseClient } from './supabase-client';
import type { File } from '@/lib/types';

// Files service methods
export const fileService = {
  /**
   * Get files for a project
   */
  async getFilesByProject(projectId: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });
    
    // Map DB column names to client-side property names
    if (response.data) {
      response.data = response.data.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: file.uploaded_at,
        uploadedBy: file.uploaded_by,
        project: file.project_id,
        description: file.description || '',
        url: file.is_public ? 
          `https://${file.space_name}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${file.space_key}` : 
          null
      }));
    }
    
    return response;
  },
  
  /**
   * Get a specific file by ID
   */
  async getFileById(id: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (response.data) {
      response.data = {
        id: response.data.id,
        name: response.data.name,
        type: response.data.type,
        size: response.data.size,
        uploadedAt: response.data.uploaded_at,
        uploadedBy: response.data.uploaded_by,
        project: response.data.project_id,
        description: response.data.description || '',
        url: response.data.is_public ? 
          `https://${response.data.space_name}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${response.data.space_key}` : 
          null
      };
    }
    
    return response;
  },
  
  /**
   * Create a file record
   */
  async createFile(fileData: {
    name: string;
    type: string;
    size: string;
    project_id: string;
    description?: string;
    space_name: string;
    space_key: string;
    content_type: string;
    etag?: string;
    is_public: boolean;
    path: string;
  }) {
    const supabase = getSupabaseClient();
    
    try {
      // Get the current user
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!userData?.user?.id) {
        throw new Error("You must be logged in to upload a file");
      }
      
      const uploaded_by = userData.user.id;
      
      // Create the file record in Supabase
      const response = await supabase
        .from('files')
        .insert([{
          ...fileData,
          uploaded_by,
          uploaded_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        }])
        .select();
      
      // Format the response
      if (response.data && response.data.length > 0) {
        const insertedFile = response.data[0];
        
        // Create a transformed file object
        const transformedFile = {
          id: insertedFile.id,
          name: insertedFile.name,
          type: insertedFile.type,
          size: insertedFile.size,
          uploadedAt: insertedFile.uploaded_at,
          uploadedBy: insertedFile.uploaded_by,
          project: insertedFile.project_id,
          description: insertedFile.description || '',
          url: insertedFile.is_public ? 
            `https://${insertedFile.space_name}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${insertedFile.space_key}` : 
            null
        };
        
        // Replace the array with the transformed data
        response.data = [transformedFile];
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Delete a file
   */
  async deleteFile(id: string) {
    const supabase = getSupabaseClient();
    
    try {
      // Check if the user has permission to delete this file
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        throw new Error("You must be logged in to delete a file");
      }
      
      // Get file info
      const { data: file } = await supabase
        .from('files')
        .select('uploaded_by, project_id')
        .eq('id', id)
        .single();
      
      if (!file) {
        throw new Error("File not found");
      }
      
      // Check if user is the uploader or a project admin
      if (file.uploaded_by !== userId) {
        // Check if user is a project admin
        const { data: projectMember } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', file.project_id)
          .eq('user_id', userId)
          .single();
        
        if (!projectMember || !['admin', 'owner'].includes(projectMember.role)) {
          throw new Error("You don't have permission to delete this file");
        }
      }
      
      // Delete the file from Supabase
      const result = await supabase
        .from('files')
        .delete()
        .eq('id', id);
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  }
}; 