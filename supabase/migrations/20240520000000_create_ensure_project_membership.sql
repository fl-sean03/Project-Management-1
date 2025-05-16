-- Create a function to safely ensure project membership with conflict handling
CREATE OR REPLACE FUNCTION ensure_project_membership(
  p_project_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'member'
) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Insert with ON CONFLICT DO NOTHING to handle race conditions
  -- between triggers and application code
  INSERT INTO project_members (project_id, user_id, role, created_at)
  VALUES (p_project_id, p_user_id, p_role, NOW())
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  -- Return true if no error
  success := TRUE;
  RETURN success;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in ensure_project_membership: %', SQLERRM;
    success := FALSE;
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Update the project creation trigger to use our safer function
CREATE OR REPLACE FUNCTION add_owner_to_project_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Add debugging log
  RAISE NOTICE 'Adding owner % to project % with role owner', NEW.owner_id, NEW.id;
  
  -- Use our safer function to handle conflicts
  PERFORM ensure_project_membership(NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- First disable the existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS add_owner_as_admin ON projects;

-- Create a new trigger with a different name
CREATE TRIGGER ensure_project_owner_membership
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_owner_to_project_members();

-- Add a direct fix for the dual trigger issue - this should properly handle race conditions
-- Add a new function to directly handle inserting project members with conflict resolution
CREATE OR REPLACE FUNCTION safely_add_project_member(
  p_project_id UUID,
  p_user_id UUID,
  p_member_role TEXT
) RETURNS VOID AS $$
BEGIN
  -- Try to insert with ON CONFLICT DO NOTHING
  INSERT INTO project_members (project_id, user_id, role, created_at)
  VALUES (p_project_id, p_user_id, p_member_role, NOW())
  ON CONFLICT (project_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix existing project owners that might be missing from project_members
CREATE OR REPLACE FUNCTION fix_missing_project_owners() RETURNS VOID AS $$
DECLARE
  project_rec RECORD;
BEGIN
  FOR project_rec IN SELECT id, owner_id FROM projects LOOP
    -- Add the owner with ON CONFLICT DO NOTHING
    PERFORM safely_add_project_member(project_rec.id, project_rec.owner_id, 'owner');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix existing projects
SELECT fix_missing_project_owners(); 