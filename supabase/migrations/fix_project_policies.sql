-- First, fix project_members policies
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Project admins can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Project members can add members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view members of their projects" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON public.project_members;

-- Now fix project_email_invites policies
DROP POLICY IF EXISTS "Allow project members to create invites" ON public.project_email_invites;
DROP POLICY IF EXISTS "Allow project members to view invites" ON public.project_email_invites;

-- Drop existing function
DROP FUNCTION IF EXISTS is_project_member(uuid, uuid);

-- Create a function to check if user is a project member
CREATE OR REPLACE FUNCTION check_project_membership(p_project_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id AND p.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = p_project_id AND pm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Create a policy for project owners that allows all operations
CREATE POLICY "Project owners can manage members" 
ON public.project_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_members.project_id AND owner_id = auth.uid()
  )
);

-- Create a policy for project admins that allows all operations
CREATE POLICY "Project admins can manage members" 
ON public.project_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id 
    AND p.owner_id = auth.uid()
  )
);

-- Create a policy for project members that allows adding new members
CREATE POLICY "Project members can add members" 
ON public.project_members FOR INSERT 
WITH CHECK (
  check_project_membership(project_members.project_id, auth.uid())
);

-- Create a policy for viewing project members
CREATE POLICY "Users can view members of their projects" 
ON public.project_members FOR SELECT 
USING (
  check_project_membership(project_members.project_id, auth.uid())
);

-- Create a policy for project owners to remove members
CREATE POLICY "Project owners can remove members" 
ON public.project_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id 
    AND p.owner_id = auth.uid()
  )
);

-- Enable RLS
ALTER TABLE public.project_email_invites ENABLE ROW LEVEL SECURITY;

-- Create a policy for project members to create invites
CREATE POLICY "Allow project members to create invites" 
ON public.project_email_invites FOR INSERT 
WITH CHECK (
  check_project_membership(project_email_invites.project_id, auth.uid())
);

-- Create a policy for project members to view invites
CREATE POLICY "Allow project members to view invites" 
ON public.project_email_invites FOR SELECT 
USING (
  check_project_membership(project_email_invites.project_id, auth.uid())
); 