import { getSupabaseClient } from './supabase-client';
import type { Task } from '@/lib/types';

// Tasks service methods
export const taskService = {
  /**
   * Get all tasks for a specific project
   */
  async getTasksByProject(projectId: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
    
    // Map DB column names to client-side property names
    if (response.data) {
      response.data = response.data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        createdAt: task.created_at,
        estimatedHours: task.estimated_hours,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        tags: task.tags || [],
        comments: 0
      }));
    }
    
    return response;
  },
  
  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    // Map DB column names to client-side property names
    if (response.data) {
      response.data = {
        id: response.data.id,
        title: response.data.title,
        description: response.data.description,
        status: response.data.status,
        priority: response.data.priority,
        dueDate: response.data.due_date,
        createdAt: response.data.created_at,
        estimatedHours: response.data.estimated_hours,
        project_id: response.data.project_id,
        assignee_id: response.data.assignee_id,
        tags: response.data.tags || [],
        comments: 0
      };
    }
    
    return response;
  },

  /**
   * Get all tasks assigned to a specific user
   */
  async getTasksByAssignee(assigneeId: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', assigneeId)
      .order('due_date', { ascending: true });
    
    // Map DB column names to client-side property names
    if (response.data) {
      response.data = response.data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        createdAt: task.created_at,
        estimatedHours: task.estimated_hours,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        tags: task.tags || [],
        comments: 0
      }));
    }
    
    return response;
  },

  /**
   * Create a new task
   */
  async createTask(taskData: {
    title: string;
    description?: string;
    project_id: string;
    assignee_id?: string;
    due_date?: string;
    priority?: string;
    status?: string;
    estimated_hours?: number;
    tags?: string[];
  }) {
    const supabase = getSupabaseClient();
    
    try {
      // Get the current user
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!userData?.user?.id) {
        throw new Error("You must be logged in to create a task");
      }
      
      // Set created_by to current user
      const created_by = userData.user.id;
      
      // Ensure required fields and set defaults
      const task = {
        ...taskData,
        status: taskData.status || 'To Do',
        priority: taskData.priority || 'Medium',
        created_by,
        created_at: new Date().toISOString()
      };
      
      // Insert the task
      const response = await supabase
        .from('tasks')
        .insert([task])
        .select();
      
      // Map DB response to client-side task format if there's data
      if (response.data && response.data.length > 0) {
        const insertedTask = response.data[0];
        // Create a transformed task object
        const transformedTask = {
          id: insertedTask.id,
          title: insertedTask.title,
          description: insertedTask.description || '',
          status: insertedTask.status,
          priority: insertedTask.priority,
          dueDate: insertedTask.due_date || '',
          createdAt: insertedTask.created_at,
          estimatedHours: insertedTask.estimated_hours || 0,
          project_id: insertedTask.project_id,
          assignee_id: insertedTask.assignee_id || '',
          tags: insertedTask.tags || [],
          comments: 0
        };
        
        // Replace the array with a single object
        response.data = [transformedTask];
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Update a task's status
   */
  async updateTaskStatus(taskId: string, status: string) {
    const supabase = getSupabaseClient();
    
    try {
      const response = await supabase
        .from('tasks')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId)
        .select();
      
      // Map DB response to client-side task format if there's data
      if (response.data && response.data.length > 0) {
        const updatedTask = response.data[0];
        // Create a transformed task object
        const transformedTask = {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description || '',
          status: updatedTask.status,
          priority: updatedTask.priority,
          dueDate: updatedTask.due_date || '',
          createdAt: updatedTask.created_at,
          estimatedHours: updatedTask.estimated_hours || 0,
          project_id: updatedTask.project_id,
          assignee_id: updatedTask.assignee_id || '',
          tags: updatedTask.tags || [],
          comments: 0
        };
        
        // Replace the array with the transformed data
        response.data = [transformedTask];
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string;
    estimated_hours: number;
    assignee_id: string;
    tags: string[];
  }>) {
    const supabase = getSupabaseClient();
    
    try {
      const response = await supabase
        .from('tasks')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId)
        .select();
      
      if (response.error) {
        throw response.error;
      }
      
      // Map DB response to client-side task format if there's data
      if (response.data && response.data.length > 0) {
        const updatedTask = response.data[0];
        // Create a transformed task object
        const transformedTask = {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description || '',
          status: updatedTask.status,
          priority: updatedTask.priority,
          dueDate: updatedTask.due_date || '',
          createdAt: updatedTask.created_at,
          estimatedHours: updatedTask.estimated_hours || 0,
          project_id: updatedTask.project_id,
          assignee_id: updatedTask.assignee_id || '',
          tags: updatedTask.tags || [],
          comments: 0
        };
        
        // Replace the array with the transformed data
        response.data = [transformedTask];
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  },
  
  /**
   * Delete a task
   */
  async deleteTask(taskId: string) {
    const supabase = getSupabaseClient();
    
    try {
      // First check if the user has permission to delete this task
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        throw new Error("You must be logged in to delete a task");
      }
      
      // Check if user is either the creator or a project member with appropriate role
      const { data: task } = await supabase
        .from('tasks')
        .select('project_id, created_by')
        .eq('id', taskId)
        .single();
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      // If user is not the creator, check if they're a project admin
      if (task.created_by !== userId) {
        const { data: projectMember } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', task.project_id)
          .eq('user_id', userId)
          .single();
        
        if (!projectMember || !['admin', 'owner'].includes(projectMember.role)) {
          throw new Error("You do not have permission to delete this task");
        }
      }
      
      // Delete the task
      const response = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (response.error) {
        throw response.error;
      }
      
      return response;
    } catch (err) {
      throw err;
    }
  }
}; 