-- Migration to fix "Database error saving new user" by making the profile creation trigger robust

-- 1. Ensure profiles table has all necessary columns and constraints
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'subscriber',
  bio TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure status column exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' NOT NULL;
    END IF;
END $$;

-- 2. Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
  base_username TEXT;
  full_name_val TEXT;
  avatar_url_val TEXT;
  role_val TEXT;
  bio_val TEXT;
  metadata_val JSONB;
  status_val TEXT;
  final_username TEXT;
BEGIN
  -- Extract values from metadata with safe defaults
  username_val := NEW.raw_user_meta_data->>'username';
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  avatar_url_val := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber');
  bio_val := COALESCE(NEW.raw_user_meta_data->>'bio', '');
  metadata_val := COALESCE(NEW.raw_user_meta_data->>'metadata', '{}'::jsonb);
  status_val := COALESCE(NEW.raw_user_meta_data->>'status', 'active');

  -- Logic to determine username
  IF username_val IS NOT NULL AND username_val != '' THEN
    final_username := username_val;
  ELSE
    -- Fallback: derive from email
    base_username := split_part(NEW.email, '@', 1);
    -- Sanitize: remove non-alphanumeric characters to be safe
    base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
    
    IF length(base_username) < 3 THEN
        base_username := 'user_' || substr(md5(random()::text), 1, 6);
    END IF;
    final_username := base_username;
  END IF;

  -- Attempt insertion with retry logic for unique constraint violations
  BEGIN
    INSERT INTO public.profiles (
      id, username, full_name, avatar_url, email, role, bio, metadata, status
    ) VALUES (
      NEW.id, final_username, full_name_val, avatar_url_val, NEW.email, role_val, bio_val, metadata_val, status_val
    );
  EXCEPTION WHEN unique_violation THEN
    -- If username exists, append a random suffix and try again
    -- This handles race conditions or collisions in fallback generation
    final_username := final_username || '_' || floor(random() * 10000)::text;
    
    BEGIN
      INSERT INTO public.profiles (
        id, username, full_name, avatar_url, email, role, bio, metadata, status
      ) VALUES (
        NEW.id, final_username, full_name_val, avatar_url_val, NEW.email, role_val, bio_val, metadata_val, status_val
      );
    EXCEPTION WHEN OTHERS THEN
      -- If it fails again, log the error (if possible) and raise exception to rollback auth user creation
      -- We raise exception to prevent "ghost" users (auth user without profile)
      RAISE EXCEPTION 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Unexpected error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
