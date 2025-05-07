import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a singleton pattern for the Supabase client
let supabaseInstance: SupabaseClient | null = null;

// Initialize Supabase client
export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
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
    let query = supabase.from('projects').select('*');
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
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
    
    return await query;
  },

  // Add this method to the projectService
  async getProjectMembers(projectId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);
  },
  
  // Add method to add a team member to a project
  async addProjectMember(projectId: string, userId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: userId
      }]);
  },
  
  // Add create project method
  async createProject(projectData: Partial<Project>) {
    const supabase = getSupabaseClient();
    
    // Ensure created_at is set
    const now = new Date().toISOString();
    
    // Create a copy of the data without the team field
    const { team, ...projectDataWithoutTeam } = projectData;
    
    // Make sure we have an owner_id (required field)
    if (!projectDataWithoutTeam.owner_id) {
      // Get the current user as the owner if not specified
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        projectDataWithoutTeam.owner_id = userData.user.id;
      } else {
        // If no user is available, we'll need a default owner ID
        // This is a fallback for testing/development
        projectDataWithoutTeam.owner_id = "00000000-0000-0000-0000-000000000001";
      }
    }
    
    return await supabase
      .from('projects')
      .insert([{
        ...projectDataWithoutTeam,
        created_at: now,
        status: projectData.status || 'Not Started',
        progress: projectData.progress || 0
      }]);
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