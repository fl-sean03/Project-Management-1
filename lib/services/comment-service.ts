import { getSupabaseClient } from './supabase-client';
import type { Comment } from '@/lib/types';

// Comments service methods
export const commentService = {
  /**
   * Get comments for a task
   */
  async getCommentsByTask(taskId: string) {
    const supabase = getSupabaseClient();
    
    try {
      // Get comments for the task
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (!comments || comments.length === 0) {
        return { data: [], error: null };
      }
      
      // Get unique user IDs from comments
      const userIds = [...new Set(comments.map(comment => comment.user_id))];
      
      // Fetch user data separately
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', userIds);
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        // Return comments without user data if we can't fetch users
        return { data: comments, error: null };
      }
      
      // Create a map of userId to user object for quick lookups
      const userMap: { [key: string]: any } = {};
      if (users) {
        users.forEach(user => {
          userMap[user.id] = user;
        });
      }
      
      // Attach user data to each comment
      const commentsWithUsers = comments.map(comment => ({
        ...comment,
        users: userMap[comment.user_id] || null
      }));
      
      return { data: commentsWithUsers, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
  
  /**
   * Add a comment to a task
   */
  async addComment(commentData: {
    content: string;
    task_id: string;
    project_id: string;
  }) {
    const supabase = getSupabaseClient();
    
    try {
      // Get the current user
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!userData?.user?.id) {
        throw new Error("You must be logged in to add a comment");
      }
      
      // Create the comment
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          content: commentData.content,
          task_id: commentData.task_id,
          project_id: commentData.project_id,
          user_id: userData.user.id,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // If comment was inserted successfully, fetch the user data
      if (data && data.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', data[0].user_id)
          .single();
        
        if (userError) {
          console.error("Error fetching user data:", userError);
          return { data, error: null };
        }
        
        // Add user data to the comment
        const commentWithUser = {
          ...data[0],
          users: userData
        };
        
        return { data: [commentWithUser], error: null };
      }
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
  
  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string) {
    const supabase = getSupabaseClient();
    
    try {
      // Check if the user is the owner of the comment
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        throw new Error("You must be logged in to update a comment");
      }
      
      // Get the comment to check ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
      
      if (!comment) {
        throw new Error("Comment not found");
      }
      
      if (comment.user_id !== userId) {
        throw new Error("You can only update your own comments");
      }
      
      // Update the comment
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content,
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId)
        .select();
      
      if (error) {
        throw error;
      }
      
      // If comment was updated successfully, fetch the user data
      if (data && data.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', data[0].user_id)
          .single();
        
        if (userError) {
          console.error("Error fetching user data:", userError);
          return { data, error: null };
        }
        
        // Add user data to the comment
        const commentWithUser = {
          ...data[0],
          users: userData
        };
        
        return { data: [commentWithUser], error: null };
      }
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
  
  /**
   * Delete a comment
   */
  async deleteComment(commentId: string) {
    const supabase = getSupabaseClient();
    
    try {
      // Check if the user is the owner of the comment
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        throw new Error("You must be logged in to delete a comment");
      }
      
      // Get the comment to check ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, project_id')
        .eq('id', commentId)
        .single();
      
      if (!comment) {
        throw new Error("Comment not found");
      }
      
      // Allow comment owners or project admins to delete
      if (comment.user_id !== userId) {
        // Check if user is a project admin
        const { data: projectMember } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', comment.project_id)
          .eq('user_id', userId)
          .single();
        
        if (!projectMember || !['admin', 'owner'].includes(projectMember.role)) {
          throw new Error("You don't have permission to delete this comment");
        }
      }
      
      // Delete the comment
      const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
}; 