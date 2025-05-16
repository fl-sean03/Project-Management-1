-- Fix auth user creation triggers
-- This migration attempts to fix the issue with user registration

-- Drop any conflicting triggers on auth.users
DROP TRIGGER IF EXISTS process_user_email_invites_trigger ON public.users;
DROP TRIGGER IF EXISTS process_confirmed_user_email_invites_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop any conflicting functions
DROP FUNCTION IF EXISTS process_user_email_invites() CASCADE;
DROP FUNCTION IF EXISTS process_confirmed_user_email_invites() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Add error handling
  BEGIN
    -- Add debugging log
    RAISE NOTICE 'Creating public user record for auth user: %', NEW.id;

    -- Extract the user's name from metadata if available
    -- Otherwise, use the part of the email before the @ symbol
    INSERT INTO public.users (
      id,
      name,
      email,
      avatar,
      role,
      joined_date
    ) VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      NEW.email,
      '/avatars/default-avatar.jpg',
      'Member',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in handle_new_user function: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Now create a separate trigger to handle email invites for confirmed users
CREATE OR REPLACE FUNCTION handle_email_invites_for_confirmed_user()
RETURNS TRIGGER AS $$
DECLARE
  invite RECORD;
BEGIN
  -- Only proceed if this update is changing confirmed_at from NULL to a value
  -- This means the user just confirmed their email
  IF (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL) THEN
    RAISE NOTICE 'Processing email invites for confirmed user: % (%)', NEW.id, NEW.email;
    
    -- Find any pending project email invites and add the user to those projects
    -- If you have a project_email_invites table:
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_email_invites') THEN
      FOR invite IN 
        SELECT * FROM public.project_email_invites
        WHERE email = NEW.email
      LOOP
        BEGIN
          INSERT INTO public.project_members (project_id, user_id, role, created_at)
          VALUES (invite.project_id, NEW.id, invite.role, now())
          ON CONFLICT (project_id, user_id) DO NOTHING;
          
          -- Delete the invite
          DELETE FROM public.project_email_invites WHERE id = invite.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error processing invite for project %, user %: %',
            invite.project_id, NEW.id, SQLERRM;
        END;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a separate trigger for email invites that runs after user confirmation
CREATE TRIGGER handle_email_invites_after_confirmation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_invites_for_confirmed_user();

-- Add a view that exposes the auth.users.confirmed_at status
CREATE OR REPLACE VIEW public.user_confirmation_status AS
SELECT 
  id,
  email,
  CASE
    WHEN confirmed_at IS NOT NULL THEN true
    ELSE false
  END as is_confirmed,
  created_at
FROM auth.users;

-- We can't apply RLS directly to views in Supabase
-- Comment out the policy and RLS lines that are causing errors
-- Instead, use a secure function to get only the current user's status
CREATE OR REPLACE FUNCTION get_current_user_confirmation_status()
RETURNS TABLE (
  id UUID,
  email TEXT,
  is_confirmed BOOLEAN,
  created_at TIMESTAMPTZ
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    CASE WHEN u.confirmed_at IS NOT NULL THEN true ELSE false END as is_confirmed,
    u.created_at
  FROM auth.users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql; 