-- This migration disables triggers that are causing duplicate entries in project_members
-- There's a race condition between database triggers and application code both trying
-- to add the project owner to the project_members table

-- Disable the triggers from add_project_owner_trigger.sql that automatically
-- add project owners to the project_members table
DROP TRIGGER IF EXISTS add_owner_as_admin ON projects;
DROP TRIGGER IF EXISTS update_owner_membership ON projects;

-- Disable any other triggers we created in our fix attempts
DROP TRIGGER IF EXISTS ensure_project_owner_membership ON projects;
DROP TRIGGER IF EXISTS add_owner_to_members ON projects;

-- No need to drop the functions, just disable the triggers
-- Our application code will handle adding owners to projects manually 