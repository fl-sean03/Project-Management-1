-- This trigger automatically adds project owners as admin members
-- when a project is created

-- First, let's make sure we don't have duplicate functions/triggers
DROP TRIGGER IF EXISTS add_owner_as_admin ON projects;
DROP FUNCTION IF EXISTS add_owner_to_project_members();

-- Create function to add project owner as admin in project_members
CREATE OR REPLACE FUNCTION add_owner_to_project_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Add debugging log
  RAISE NOTICE 'Adding owner % to project % with role admin', NEW.owner_id, NEW.id;
  
  -- Insert the project owner as an admin
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after project creation
CREATE TRIGGER add_owner_as_admin
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_owner_to_project_members();

-- Also add additional trigger for project owner updates
CREATE OR REPLACE FUNCTION update_project_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- If owner_id changed, update project_members
  IF NEW.owner_id <> OLD.owner_id THEN
    -- Add new owner as admin
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'admin')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for owner updates
CREATE TRIGGER update_owner_membership
AFTER UPDATE ON projects
FOR EACH ROW
WHEN (NEW.owner_id <> OLD.owner_id)
EXECUTE FUNCTION update_project_owner_membership();

-- Ensure existing projects have their owners in project_members
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id, owner_id FROM projects LOOP
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (project_record.id, project_record.owner_id, 'admin')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql; 