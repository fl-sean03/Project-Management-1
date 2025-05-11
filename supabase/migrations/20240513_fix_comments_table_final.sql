-- Final fix for comments table
-- This migration completely rebuilds the comments table with proper structure and relationships

-- First drop any existing comments table to start fresh
DROP TABLE IF EXISTS public.comments CASCADE;

-- Create the comments table with all necessary columns and constraints
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  task_id UUID NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints one by one to ensure they work
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_task_id_fkey 
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
  ADD CONSTRAINT comments_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX comments_task_id_idx ON public.comments(task_id);
CREATE INDEX comments_project_id_idx ON public.comments(project_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Clear any existing policies
DROP POLICY IF EXISTS "Allow project members to view comments" ON public.comments;
DROP POLICY IF EXISTS "Allow project members to add comments" ON public.comments;
DROP POLICY IF EXISTS "Allow users to update own comments" ON public.comments;
DROP POLICY IF EXISTS "Allow users to delete own comments" ON public.comments;

-- Create simple RLS policies for comments
-- Policy for viewing comments (any project member or owner can view)
CREATE POLICY "Allow viewing comments" ON public.comments
  FOR SELECT
  USING (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = comments.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR 
    -- User is a project member
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = comments.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Policy for adding comments (must be a member or owner, and can only set own user_id)
CREATE POLICY "Allow adding comments" ON public.comments
  FOR INSERT
  WITH CHECK (
    -- Only allow setting your own user_id
    user_id = auth.uid()
    AND
    (
      -- User is the project owner
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = comments.project_id 
        AND projects.owner_id = auth.uid()
      )
      OR 
      -- User is a project member
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = comments.project_id
        AND project_members.user_id = auth.uid()
      )
    )
  );

-- Policy for updating comments (only the author can update their comment)
CREATE POLICY "Allow updating own comments" ON public.comments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy for deleting comments (author or project owner can delete)
CREATE POLICY "Allow deleting comments" ON public.comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = comments.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Add a function to count comments for a task
CREATE OR REPLACE FUNCTION public.task_comments_count(task_row public.tasks)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.comments
  WHERE comments.task_id = task_row.id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add a convenient RPC function to add a comment (simplifies client-side code)
CREATE OR REPLACE FUNCTION public.add_comment(
  p_task_id UUID,
  p_content TEXT
)
RETURNS public.comments AS $$
DECLARE
  v_project_id UUID;
  v_comment public.comments;
BEGIN
  -- Get the project_id from the task
  SELECT project_id INTO v_project_id
  FROM public.tasks
  WHERE id = p_task_id;
  
  -- If the task doesn't exist or doesn't have a project_id, raise an error
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Task not found or has no project ID';
  END IF;
  
  -- Insert the comment and return it
  INSERT INTO public.comments (
    content,
    task_id,
    project_id,
    user_id
  ) VALUES (
    p_content,
    p_task_id,
    v_project_id,
    auth.uid()
  )
  RETURNING * INTO v_comment;
  
  RETURN v_comment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 