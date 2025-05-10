import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase';

// Use a singleton pattern for the Supabase client
let supabaseInstance: SupabaseClient | null = null;

// Initialize Supabase client
export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use the browser client for client-side code to ensure auth state is shared
    supabaseInstance = createBrowserSupabaseClient();
  } else {
    // Fallback to regular client for server-side code
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
}

// Project type definition
export type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  due_date: string;
  team: string[];
  tasks: number;
  completed_tasks: number;
  priority: string;
  category: string;
  created_at: string;
  start_date: string;
  budget: number;
  client: string;
  owner_id: string;
  objectives: string[];
  milestones: any[];
};

// User type definition
export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  department: string;
  team: string;
  location: string;
  phone: string;
  joinedDate: string;
  bio: string;
};

// Task type definition
export type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  estimatedHours: number;
  project: string;
  assignee: string;
  tags: string[];
  comments: number;
};

// Activity type definition
export type Activity = {
  id: string;
  user: string;       // maps to user_id in DB
  action: string;
  target: string;
  targetId: string;   // maps to target_id in DB
  targetName: string; // maps to target_name in DB
  project: string;    // maps to project_id in DB
  time: string;
  content: string | null;
  created_at?: string;
};

// File type definition
export type File = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  project: string;
  description: string;
  url: string;
};

// Project service methods
export const projectService = {
  async getAllProjects() {
    const supabase = getSupabaseClient();
    return await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
  },
  
  async getProjectById(id: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
  },
  
  async searchProjects(searchQuery = '', statusFilter = 'all', sortBy = 'newest') {
    const supabase = getSupabaseClient();
    console.log(`Searching projects with query: "${searchQuery}", status: "${statusFilter}", sort: "${sortBy}"`);
    
    try {
      // Check authentication state for debugging
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      console.log("Current authenticated user:", userId || "No user authenticated");
      
      if (!userId) {
        console.warn("No authenticated user found when searching projects");
        return { data: [], error: new Error("Authentication required") };
      }
      
      // Start building the query - only fetch projects owned by user for now
      let query = supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId);  // Filter only by owner_id
      
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
      console.log("Supabase returned projects:", result);
      
      if (result.error) {
        console.error("Error fetching projects:", result.error);
      } else if (result.data) {
        console.log(`Found ${result.data.length} projects`);
        
        // Transform the data for easier debugging
        result.data = result.data.map(project => {
          console.log(`Project ${project.id} owner: ${project.owner_id}`);
          return {
            ...project,
            team: project.team || []
          };
        });
      }
      
      return result;
    } catch (err) {
      console.error("Exception in searchProjects:", err);
      return { data: null, error: err };
    }
  },

  // Add this method to the projectService
  async getProjectMembers(projectId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('project_members')
      .select('user_id, role')
      .eq('project_id', projectId);
  },
  
  // Add method to add a team member to a project
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
  
  // Add create project method
  async createProject(projectData: Partial<Project>) {
    const supabase = getSupabaseClient();
    
    try {
      // Check auth before anything else
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      console.log("Auth check for createProject:", {
        user: authData?.user?.id,
        error: authError?.message
      });
      
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error(`Authentication error: ${authError.message}. Please sign in again.`);
      }
      
      if (!authData?.user?.id) {
        console.error("No authenticated user found");
        throw new Error("You must be logged in to create a project. Please sign in first.");
      }
      
      // Use the authenticated user's ID
      const userId = authData.user.id;
      console.log("Creating project for user:", userId);
      
      // Ensure created_at is set
      const now = new Date().toISOString();
      
      // Create a copy of the data without the team field
      const { team, ...projectDataWithoutTeam } = projectData;
      
      // Set the owner_id explicitly
      projectDataWithoutTeam.owner_id = userId;
      
      console.log("Final project data for insert:", projectDataWithoutTeam);
      
      const result = await supabase
        .from('projects')
        .insert([{
          ...projectDataWithoutTeam,
          created_at: now,
          status: projectData.status || 'Not Started',
          progress: projectData.progress || 0
        }])
        .select();
      
      console.log("Project creation result:", result);
      
      if (result.error) {
        console.error("Error creating project:", result.error);
        throw result.error;
      }
      
      return result;
    } catch (err) {
      console.error("Exception in createProject:", err);
      throw err;
    }
  }
};

// Tasks service methods
export const taskService = {
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
        project: task.project_id,
        assignee: task.assignee_id,
        tags: task.tags || [],
        comments: 0 // Typically this would require a count query, defaulting to 0
      }));
    }
    
    return response;
  },
  
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
        project: response.data.project_id,
        assignee: response.data.assignee_id,
        tags: response.data.tags || [],
        comments: 0 // Typically this would require a count query, defaulting to 0
      };
    }
    
    return response;
  },

  // Add createTask method to create a new task
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
    
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    
    // Set default created_by to current user or fallback
    const created_by = userData?.user?.id || "00000000-0000-0000-0000-000000000001";
    
    // Ensure required fields and set defaults
    const task = {
      ...taskData,
      status: taskData.status || 'To Do',
      priority: taskData.priority || 'Medium',
      created_by
    };
    
    console.log("Creating task with data:", task);
    
    // Insert the task
    const response = await supabase
      .from('tasks')
      .insert([task])
      .select();
    
    // Map DB response to client-side task format if there's data
    if (response.data && response.data.length > 0) {
      const insertedTask = response.data[0];
      // Create a transformed task object without modifying response.data directly
      const transformedTask = {
        id: insertedTask.id,
        title: insertedTask.title,
        description: insertedTask.description || '',
        status: insertedTask.status,
        priority: insertedTask.priority,
        dueDate: insertedTask.due_date || '',
        createdAt: insertedTask.created_at,
        estimatedHours: insertedTask.estimated_hours || 0,
        project: insertedTask.project_id,
        assignee: insertedTask.assignee_id || '',
        tags: insertedTask.tags || [],
        comments: 0
      };
      
      // Replace the array with a single object
      response.data = [transformedTask];
    }
    
    return response;
  },
  
  // Update task status
  async updateTaskStatus(taskId: string, status: string) {
    const supabase = getSupabaseClient();
    
    console.log(`Updating task ${taskId} status to: ${status}`);
    
    const response = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
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
        project: updatedTask.project_id,
        assignee: updatedTask.assignee_id || '',
        tags: updatedTask.tags || [],
        comments: 0
      };
      
      // Replace the array with the transformed data
      response.data = [transformedTask];
    }
    
    return response;
  }
};

// Users service methods
export const userService = {
  async getAllUsers() {
    const supabase = getSupabaseClient();
    return await supabase
      .from('users')
      .select('*')
      .order('name');
  },
  
  async getUserById(id: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
  },
  
  async searchUsersByEmail(email: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('users')
      .select('*')
      .ilike('email', `%${email}%`)
      .order('name')
      .limit(5);
  }
};

// Activities service methods
export const activityService = {
  async getActivitiesByProject(projectId: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('activities')
      .select('*')
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
        created_at: activity.created_at
      }));
    }
    
    return response;
  },
  
  async getActivityById(id: string) {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('activities')
      .select('*')
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
        created_at: response.data.created_at
      };
    }
    
    return response;
  }
};

// Files service methods
export const fileService = {
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
    
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    const uploaded_by = userData?.user?.id || "00000000-0000-0000-0000-000000000001";
    
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
  },
  
  async deleteFile(id: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('files')
      .delete()
      .eq('id', id);
  }
}; 