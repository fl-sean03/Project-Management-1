/*
 * This file combines all the necessary SQL commands to fix the email invitation system
 * To apply this, copy this entire file and run it in the Supabase SQL Editor
 */

-- 1. Make sure the project_email_invites table exists with all required columns
CREATE TABLE IF NOT EXISTS public.project_email_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Make project_id + email unique to prevent duplicate invites
  CONSTRAINT project_email_unique UNIQUE (project_id, email)
);

-- 2. Make sure RLS is enabled
ALTER TABLE public.project_email_invites ENABLE ROW LEVEL SECURITY;

-- 3. Fix the RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Project owners can manage invites" ON public.project_email_invites;
DROP POLICY IF EXISTS "Project admins can manage invites" ON public.project_email_invites;
DROP POLICY IF EXISTS "Authenticated users can create invites for their projects" ON public.project_email_invites;

-- Create more permissive policies that allow insertion and management
CREATE POLICY "Project owners can manage invites" ON public.project_email_invites
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_email_invites.project_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_email_invites.project_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage invites" ON public.project_email_invites
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_email_invites.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_email_invites.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'owner')
    )
  );

-- Create a more permissive policy for all authenticated users to insert
CREATE POLICY "Authenticated users can create invites for their projects" ON public.project_email_invites
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      -- User is project owner
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_email_invites.project_id
        AND p.owner_id = auth.uid()
      )
      OR
      -- User is project admin/member
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_email_invites.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'member', 'owner')
      )
    )
  );

-- 4. Create or update indices for better performance
DROP INDEX IF EXISTS project_email_invites_email_idx;
DROP INDEX IF EXISTS project_email_invites_project_idx;
CREATE INDEX project_email_invites_email_idx ON public.project_email_invites (email);
CREATE INDEX project_email_invites_project_idx ON public.project_email_invites (project_id);

-- 5. Fix the process_email_invites function and trigger
CREATE OR REPLACE FUNCTION public.process_email_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite RECORD;
BEGIN
  -- Only run when a user is confirmed (email verified)
  IF NEW.confirmed_at IS NOT NULL AND 
     (OLD.confirmed_at IS NULL OR OLD.confirmed_at <> NEW.confirmed_at) THEN
    
    -- Find and process invites for this email
    FOR invite IN 
      SELECT * FROM public.project_email_invites
      WHERE email = NEW.email
    LOOP
      BEGIN
        -- Add user to the project
        INSERT INTO public.project_members (project_id, user_id, role, created_at)
        VALUES (invite.project_id, NEW.id, invite.role, now())
        ON CONFLICT (project_id, user_id) DO NOTHING;
          
        -- Delete the invite after processing
        DELETE FROM public.project_email_invites WHERE id = invite.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error processing invite: %', SQLERRM;
      END;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for email invites processing
DROP TRIGGER IF EXISTS process_email_invites_trigger ON auth.users;
CREATE TRIGGER process_email_invites_trigger
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.process_email_invites();

-- Final success message
DO $$
BEGIN
  RAISE NOTICE 'Email invitation system has been successfully configured!';
END $$; 