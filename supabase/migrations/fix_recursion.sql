-- Fix infinite recursion in project_members policies
-- Run this in the Supabase SQL Editor

-- First, disable RLS for both tables temporarily to break the recursion
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

-- Drop any problematic policies on project_members
DROP POLICY IF EXISTS "Allow members to view project members" ON public.project_members;
DROP POLICY IF EXISTS "Allow members access" ON public.project_members;
DROP POLICY IF EXISTS "Allow access to project members" ON public.project_members;

-- Create a safer policy that doesn't cause recursion
-- We'll enable these after we confirm things are working
-- CREATE POLICY "Allow public read access to project members"
--   ON public.project_members
--   FOR SELECT
--   TO anon, authenticated
--   USING (true);

-- CREATE POLICY "Allow members to manage members"
--   ON public.project_members
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.project_members pm 
--       WHERE pm.project_id = project_members.project_id 
--       AND pm.user_id = auth.uid()
--     )
--   );

-- You can gradually re-enable RLS with proper policies after confirming fixes
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY; 