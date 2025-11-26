-- Add status column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Migrate data from metadata if exists
UPDATE public.profiles
SET status = COALESCE(metadata->>'status', 'active')
WHERE status IS NULL;

-- Ensure status is not null
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;
