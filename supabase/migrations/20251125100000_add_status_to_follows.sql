-- Add status column to follows table
ALTER TABLE public.follows ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Add check constraint for status
ALTER TABLE public.follows ADD CONSTRAINT follows_status_check CHECK (status IN ('pending', 'accepted'));

-- Update existing follows to accepted (assuming existing relationships are established)
UPDATE public.follows SET status = 'accepted';
