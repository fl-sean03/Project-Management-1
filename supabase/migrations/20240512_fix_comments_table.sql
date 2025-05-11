-- Basic comments table fix - minimal approach

-- Drop the existing table completely
DROP TABLE IF EXISTS public.comments CASCADE;

-- Create the comments table with proper structure
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  task_id UUID NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraints
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
  ADD CONSTRAINT comments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX comments_task_id_idx ON public.comments(task_id);
CREATE INDEX comments_project_id_idx ON public.comments(project_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Basic view policy
CREATE POLICY "Allow project members to view comments" ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = comments.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = comments.project_id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Basic insert policy
CREATE POLICY "Allow project members to add comments" ON public.comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = comments.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = comments.project_id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Simple update and delete policies
CREATE POLICY "Allow users to update own comments" ON public.comments
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete own comments" ON public.comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Add task_comments_count function for comment counting
CREATE OR REPLACE FUNCTION public.task_comments_count(task_row public.tasks)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.comments
  WHERE comments.task_id = task_row.id;
$$ LANGUAGE SQL SECURITY DEFINER; 