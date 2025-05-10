-- This migration creates a trigger to automatically add new auth users
-- to the public.users table

-- First, let's make sure we don't have duplicate functions/triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill existing auth users who don't have public user records
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT 
      au.id, 
      au.email, 
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE pu.id IS NULL
  LOOP
    INSERT INTO public.users (
      id,
      name,
      email,
      avatar,
      role,
      joined_date
    ) VALUES (
      auth_user.id,
      COALESCE(
        auth_user.raw_user_meta_data->>'name',
        auth_user.raw_user_meta_data->>'full_name',
        split_part(auth_user.email, '@', 1)
      ),
      auth_user.email,
      '/avatars/default-avatar.jpg',
      'Member',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql; 