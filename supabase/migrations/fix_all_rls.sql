-- Comprehensive fix for RLS issues in Zyra Project Management app
-- Run this in the Supabase SQL Editor

-- First, disable RLS on all related tables to break any recursion issues
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies that might be causing recursion
-- Project Members policies
DROP POLICY IF EXISTS "Allow members to view project members" ON public.project_members;
DROP POLICY IF EXISTS "Allow members access" ON public.project_members;
DROP POLICY IF EXISTS "Allow access to project members" ON public.project_members;

-- Projects policies
DROP POLICY IF EXISTS "Allow members to view projects" ON public.projects;
DROP POLICY IF EXISTS "Allow members to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow members to delete projects" ON public.projects;
DROP POLICY IF EXISTS "Allow members to access projects" ON public.projects;

-- Tasks policies
DROP POLICY IF EXISTS "Allow members to view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow members to update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow members to delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow members to access tasks" ON public.tasks;

-- Activities policies
DROP POLICY IF EXISTS "Allow members to view activities" ON public.activities;
DROP POLICY IF EXISTS "Allow members to update activities" ON public.activities;
DROP POLICY IF EXISTS "Allow members access to activities" ON public.activities;

-- Comments policies
DROP POLICY IF EXISTS "Allow members to view comments" ON public.comments;
DROP POLICY IF EXISTS "Allow members to update comments" ON public.comments;
DROP POLICY IF EXISTS "Allow members to access comments" ON public.comments;

-- Users policies
DROP POLICY IF EXISTS "Allow users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow access to users" ON public.users;

-- For debugging/development, you can leave RLS disabled
-- For production, you should gradually add back proper policies that don't cause recursion
-- and then re-enable RLS

-- EXAMPLE of proper non-recursive policies to add later:
-- CREATE POLICY "Allow public read access to projects"
--   ON public.projects
--   FOR SELECT
--   TO anon, authenticated
--   USING (true);

-- CREATE POLICY "Allow public read access to project_members"
--   ON public.project_members  
--   FOR SELECT
--   TO anon, authenticated
--   USING (true); 