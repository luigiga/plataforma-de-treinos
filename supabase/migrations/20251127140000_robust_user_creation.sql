  -- Replace the handle_new_user function with a more robust version
  -- This version handles username collisions by retrying with a suffix
  -- It also ensures all fields are populated correctly with defaults

  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  DECLARE
    username_val TEXT;
    base_username TEXT;
    final_username TEXT;
    full_name_val TEXT;
    avatar_url_val TEXT;
    role_val TEXT;
    bio_val TEXT;
    metadata_val JSONB;
    status_val TEXT;
    counter INTEGER := 0;
    max_attempts INTEGER := 5;
    inserted BOOLEAN := FALSE;
  BEGIN
    -- Extract values from metadata with safe defaults
    username_val := NEW.raw_user_meta_data->>'username';
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
    avatar_url_val := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');
    role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber');
    bio_val := COALESCE(NEW.raw_user_meta_data->>'bio', '');
    metadata_val := COALESCE(NEW.raw_user_meta_data->>'metadata', '{}'::jsonb);
    status_val := COALESCE(NEW.raw_user_meta_data->>'status', 'active');

    -- Logic to determine base username
    IF username_val IS NOT NULL AND username_val != '' THEN
      base_username := username_val;
    ELSE
      -- Fallback: derive from email
      base_username := split_part(NEW.email, '@', 1);
      -- Sanitize: remove non-alphanumeric characters to be safe
      base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
      
      IF length(base_username) < 3 THEN
          base_username := 'user_' || substr(md5(random()::text), 1, 6);
      END IF;
    END IF;

    final_username := base_username;

    -- Loop to handle username collisions (retry logic)
    WHILE counter < max_attempts AND NOT inserted LOOP
      BEGIN
        INSERT INTO public.profiles (
          id, username, full_name, avatar_url, email, role, bio, metadata, status
        ) VALUES (
          NEW.id, final_username, full_name_val, avatar_url_val, NEW.email, role_val, bio_val, metadata_val, status_val
        );
        inserted := TRUE;
      EXCEPTION WHEN unique_violation THEN
        -- If unique violation occurs (likely username), append random suffix and retry
        counter := counter + 1;
        final_username := base_username || '_' || floor(random() * 10000)::text;
      END;
    END LOOP;

    -- If we failed after max attempts, we must raise an exception to fail the auth transaction
    -- This prevents creating a user without a profile ("ghost user")
    IF NOT inserted THEN
       RAISE EXCEPTION 'Failed to create profile: Username collision could not be resolved after % attempts', max_attempts;
    END IF;

    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Catch any other unexpected errors
    RAISE EXCEPTION 'Unexpected error creating profile for user %: %', NEW.id, SQLERRM;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

  -- Re-attach the trigger (just to be safe and ensure it uses the new function)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  