-- This migration fixes RLS policies for anonymous access
-- Run this in the Supabase SQL editor or through migrations

-- First, check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename='projects';

-- If RLS is enabled (rowsecurity=true), we'll modify the policies
-- If no policies exist for anonymous access, create them

-- Option 1: Disable RLS for projects table (less secure but simplest fix)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS but add permissive policies (better security)
-- Uncomment these if you prefer this approach instead of disabling RLS

-- Enable RLS 
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated and anonymous users
-- CREATE POLICY "Allow anonymous read access to projects" 
--   ON public.projects
--   FOR SELECT 
--   TO authenticated, anon
--   USING (true);

-- Allow project owners/members to modify their projects
-- CREATE POLICY "Allow project members to update projects"
--   ON public.projects
--   FOR UPDATE
--   TO authenticated
--   USING (auth.uid() = ANY(team));

-- Allow project owners/members to delete their projects  
-- CREATE POLICY "Allow project members to delete projects"
--   ON public.projects
--   FOR DELETE
--   TO authenticated
--   USING (auth.uid() = ANY(team));

-- Allow authenticated users to insert projects
-- CREATE POLICY "Allow authenticated users to insert projects"
--   ON public.projects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true); 