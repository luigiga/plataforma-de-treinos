-- Workouts
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT,
    duration INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    is_circuit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public workouts are viewable by everyone" ON public.workouts;
CREATE POLICY "Public workouts are viewable by everyone" ON public.workouts FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Trainers can view own workouts" ON public.workouts;
CREATE POLICY "Trainers can view own workouts" ON public.workouts FOR SELECT USING (auth.uid() = trainer_id);
DROP POLICY IF EXISTS "Trainers can insert own workouts" ON public.workouts;
CREATE POLICY "Trainers can insert own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = trainer_id);
DROP POLICY IF EXISTS "Trainers can update own workouts" ON public.workouts;
CREATE POLICY "Trainers can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = trainer_id);
DROP POLICY IF EXISTS "Trainers can delete own workouts" ON public.workouts;
CREATE POLICY "Trainers can delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = trainer_id);

-- Exercises
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sets TEXT NOT NULL,
    reps TEXT NOT NULL,
    instructions TEXT,
    video_url TEXT,
    variations JSONB DEFAULT '[]'::jsonb
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON public.exercises;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);
DROP POLICY IF EXISTS "Trainers can manage exercises" ON public.exercises;
CREATE POLICY "Trainers can manage exercises" ON public.exercises FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE id = exercises.workout_id AND trainer_id = auth.uid())
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progress Logs
CREATE TABLE IF NOT EXISTS public.progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    workout_title TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    duration INTEGER,
    notes TEXT
);
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own logs" ON public.progress_logs;
CREATE POLICY "Users can manage own logs" ON public.progress_logs FOR ALL USING (auth.uid() = user_id);

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage follows" ON public.follows;
CREATE POLICY "Users can manage follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
CREATE POLICY "Users can view own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id OR auth.uid() = trainer_id);
DROP POLICY IF EXISTS "Trainers can insert assignments" ON public.assignments;
CREATE POLICY "Trainers can insert assignments" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = trainer_id);
