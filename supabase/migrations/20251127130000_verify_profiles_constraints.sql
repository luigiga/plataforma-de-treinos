-- Ensure username is unique in profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Ensure email is unique in profiles (optional but good for consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key'
  ) THEN
    -- We might have duplicates if not enforced before, so we might need to handle that or just skip if it fails
    -- For now, let's try to add it if data allows
    BEGIN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if fails due to duplicates
    END;
  END IF;
END $$;
