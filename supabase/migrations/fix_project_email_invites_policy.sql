-- Fix the RLS policies for project_email_invites table
-- This migration addresses the 42501 error when inserting new invites

-- First, ensure RLS is enabled
ALTER TABLE public.project_email_invites ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Project owners can manage invites" ON public.project_email_invites;
DROP POLICY IF EXISTS "Project admins can manage invites" ON public.project_email_invites;
DROP POLICY IF EXISTS "Project members can create invites" ON public.project_email_invites;
DROP POLICY IF EXISTS "Authenticated users can create invites for their projects" ON public.project_email_invites;

-- Create a single, simple policy that allows project members to create invites
CREATE POLICY "Allow project members to create invites" ON public.project_email_invites
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_email_invites.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Create a policy for viewing invites
CREATE POLICY "Allow project members to view invites" ON public.project_email_invites
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_email_invites.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Create a policy for managing invites (update/delete)
CREATE POLICY "Allow project owners and admins to manage invites" ON public.project_email_invites
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_email_invites.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_email_invites.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'owner')
  )
); 