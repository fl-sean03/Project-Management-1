-- Add new fields to the users table to match team member card requirements
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar VARCHAR(1024),
ADD COLUMN IF NOT EXISTS phone VARCHAR(32),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS team VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS skills VARCHAR(255)[];

-- Create a function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_active on user updates
CREATE TRIGGER update_user_last_active
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_last_active();

-- Update project_members table to ensure it has the necessary fields
ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Ensure there's a trigger for the owner of a project
CREATE OR REPLACE FUNCTION set_project_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record in the project_members table for the project creator
  INSERT INTO project_members (project_id, user_id, role, created_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'set_project_owner_trigger'
  ) THEN
    CREATE TRIGGER set_project_owner_trigger
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_project_owner();
  END IF;
END;
$$;
