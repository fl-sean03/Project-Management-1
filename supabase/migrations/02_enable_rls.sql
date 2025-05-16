-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
-- Users can read their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Users can read profiles of users in the same projects
CREATE POLICY "Users can view profiles of project members" 
ON public.users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    WHERE pm1.user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = pm1.project_id AND pm2.user_id = users.id
    )
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Projects Table Policies
-- Project owners can do everything
CREATE POLICY "Project owners have full access" 
ON public.projects FOR ALL 
USING (owner_id = auth.uid());

-- Project members can view projects they're part of
CREATE POLICY "Project members can view their projects" 
ON public.projects FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = projects.id AND user_id = auth.uid()
  )
);

-- Project members can update projects they're part of
CREATE POLICY "Project members can update their projects" 
ON public.projects FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = projects.id AND user_id = auth.uid()
  )
);

-- Project Members Table Policies
-- Project owners can manage members
CREATE POLICY "Project owners can manage members" 
ON public.project_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_members.project_id AND owner_id = auth.uid()
  )
);

-- Users can view members of their projects
CREATE POLICY "Users can view members of their projects" 
ON public.project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members AS pm
    WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
  )
);

-- Tasks Table Policies
-- Project members can view tasks in their projects
CREATE POLICY "Project members can view tasks" 
ON public.tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = tasks.project_id AND user_id = auth.uid()
  )
);

-- Task creators and assignees can update tasks
CREATE POLICY "Task creators and assignees can update tasks" 
ON public.tasks FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  assignee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = tasks.project_id AND owner_id = auth.uid()
  )
);

-- Project members can create tasks
CREATE POLICY "Project members can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = tasks.project_id AND user_id = auth.uid()
  )
);

-- Task creators, assignees, and project owners can delete tasks
CREATE POLICY "Task creators, assignees, and project owners can delete tasks" 
ON public.tasks FOR DELETE 
USING (
  created_by = auth.uid() OR 
  assignee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = tasks.project_id AND owner_id = auth.uid()
  )
);

-- Files Table Policies
-- Project members can view files
CREATE POLICY "Project members can view files" 
ON public.files FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = files.project_id AND user_id = auth.uid()
  )
);

-- File uploaders and project owners can update files
CREATE POLICY "File uploaders and project owners can update files" 
ON public.files FOR UPDATE 
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = files.project_id AND owner_id = auth.uid()
  )
);

-- Project members can upload files
CREATE POLICY "Project members can upload files" 
ON public.files FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = files.project_id AND user_id = auth.uid()
  )
);

-- File uploaders and project owners can delete files
CREATE POLICY "File uploaders and project owners can delete files" 
ON public.files FOR DELETE 
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = files.project_id AND owner_id = auth.uid()
  )
);

-- Activities Table Policies
-- Project members can view activities
CREATE POLICY "Project members can view activities" 
ON public.activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = activities.project_id AND user_id = auth.uid()
  )
);

-- System can create activities
CREATE POLICY "System can create activities" 
ON public.activities FOR INSERT 
WITH CHECK (true);

-- Notifications Table Policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- Comments Table Policies
-- Project members can view comments
CREATE POLICY "Project members can view comments" 
ON public.comments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.project_members ON tasks.project_id = project_members.project_id
    WHERE tasks.id = comments.task_id 
    AND project_members.user_id = auth.uid()
  )
);

-- Project members can create comments
CREATE POLICY "Project members can create comments" 
ON public.comments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.project_members ON tasks.project_id = project_members.project_id
    WHERE tasks.id = comments.task_id 
    AND project_members.user_id = auth.uid()
  )
);

-- Comment authors can update their comments
CREATE POLICY "Comment authors can update their comments" 
ON public.comments FOR UPDATE 
USING (user_id = auth.uid());

-- Comment authors and project owners can delete comments
CREATE POLICY "Comment authors and project owners can delete comments" 
ON public.comments FOR DELETE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.projects ON tasks.project_id = projects.id
    WHERE tasks.id = comments.task_id 
    AND projects.owner_id = auth.uid()
  )
); 