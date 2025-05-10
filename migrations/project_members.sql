-- Create the project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Ensure a user can only be added to a project once
  UNIQUE(project_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Add RLS policies
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Owner can read all project members
CREATE POLICY project_owner_read_members ON project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Project members can read other members of their projects
CREATE POLICY project_member_read_members ON project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Only project owners and admins can add members
CREATE POLICY project_admin_insert_members ON project_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'admin'
    )
  );

-- Only project owners and admins can update members
CREATE POLICY project_admin_update_members ON project_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'admin'
    )
  );

-- Only project owners and admins can delete members
CREATE POLICY project_admin_delete_members ON project_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'admin'
    )
  );

-- Create function to auto-add project owners as admins
CREATE OR REPLACE FUNCTION add_owner_to_project_members()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-add project owners when a project is created
CREATE TRIGGER add_owner_as_admin
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_owner_to_project_members(); 