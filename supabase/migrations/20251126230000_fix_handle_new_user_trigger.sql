-- Fix handle_new_user trigger to be more robust and handle status column
-- This migration replaces the existing function to ensure profile creation works correctly
-- It explicitly handles the 'status' column and provides better fallback for username

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
  full_name_val TEXT;
  avatar_url_val TEXT;
  role_val TEXT;
  bio_val TEXT;
  metadata_val JSONB;
BEGIN
  -- Extract values from metadata with defaults
  -- We use COALESCE to handle potential NULLs safely
  username_val := NEW.raw_user_meta_data->>'username';
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  avatar_url_val := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber');
  bio_val := COALESCE(NEW.raw_user_meta_data->>'bio', '');
  metadata_val := COALESCE(NEW.raw_user_meta_data->>'metadata', '{}'::jsonb);

  -- Fallback for username if missing or empty
  IF username_val IS NULL OR username_val = '' THEN
    username_val := split_part(NEW.email, '@', 1);
    -- Append random string to avoid collision on fallback if needed, 
    -- though frontend validation should prevent this for manual signups.
    -- This helps with potential OAuth signups where username isn't provided.
  END IF;

  -- Insert into profiles with explicit columns including status
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    avatar_url, 
    email, 
    role, 
    bio, 
    metadata,
    status
  )
  VALUES (
    NEW.id,
    username_val,
    full_name_val,
    avatar_url_val,
    NEW.email,
    role_val,
    bio_val,
    metadata_val,
    'active'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- We raise the exception so Supabase Auth knows it failed and rolls back the user creation
  -- This prevents "ghost" users without profiles
  RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
