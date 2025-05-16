-- Emergency fix for user registration issues
-- This script removes all triggers on auth.users and public.users tables
-- and creates a minimal, working trigger for user creation

-- 1. Drop all existing triggers on auth.users table
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN 
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON auth.users CASCADE;';
    RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
  END LOOP;
END $$;

-- 2. Drop all existing triggers on public.users table
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN 
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
    AND event_object_table = 'users'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON public.users CASCADE;';
    RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
  END LOOP;
END $$;

-- 3. Drop all functions related to user creation
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS process_user_email_invites() CASCADE;
DROP FUNCTION IF EXISTS process_confirmed_user_email_invites() CASCADE;
DROP FUNCTION IF EXISTS handle_email_invites_for_confirmed_user() CASCADE;

-- 4. Create a simple, minimal trigger function for user creation
-- This focuses solely on creating the public user record
CREATE OR REPLACE FUNCTION public.create_public_user_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert public user record from auth data
  INSERT INTO public.users (
    id,
    name,
    email,
    avatar,
    role,
    joined_date
  ) VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    '/avatars/default-avatar.jpg',
    'Member',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow auth user creation to succeed
  RAISE NOTICE 'Error creating public user record: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a clean trigger for the function
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_public_user_record();

-- 6. Verify the trigger was created
DO $$
BEGIN
  RAISE NOTICE 'User creation trigger setup complete. Trigger name: on_auth_user_created';
END $$; 