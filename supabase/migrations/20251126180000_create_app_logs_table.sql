CREATE TABLE IF NOT EXISTS public.app_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    url TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs (even anonymous users for login/registration errors)
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.app_logs;
CREATE POLICY "Anyone can insert logs" ON public.app_logs FOR INSERT WITH CHECK (true);

-- Only allow users to view their own logs (optional, mostly for debugging)
DROP POLICY IF EXISTS "Users can view own logs" ON public.app_logs;
CREATE POLICY "Users can view own logs" ON public.app_logs FOR SELECT USING (auth.uid() = user_id);
