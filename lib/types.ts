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
  joined_date?: string;
  bio: string;
  // New fields for enhanced user information
  last_active?: string;
  skills?: string[];
  projectRole?: string; // For team members with role in project
};

// Task type definition
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  project_id: string;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Comment type definition
export type Comment = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  task_id: string;
  project_id: string;
  users?: {
    id: string;
    name: string;
    avatar: string | null;
  };
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

// Notification type definition
export type Notification = {
  id: string;
  type: 'task_assigned' | 'comment' | 'file_uploaded';
  content: string;
  link: string;
  read: boolean;
  user_id: string;
  related_user_id: string | null;
  created_at: string;
  related_user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}; 