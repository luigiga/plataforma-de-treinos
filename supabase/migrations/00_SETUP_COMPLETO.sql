-- ============================================
-- SCRIPT COMPLETO DE SETUP DO BANCO DE DADOS
-- FitPlatform - Plataforma de Treinos Fitness
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Ele cria todas as tabelas, políticas, triggers e índices necessários
-- ============================================

-- ============================================
-- 1. TABELA DE PERFIS
-- ============================================
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- ============================================
-- 2. STORAGE PARA AVATARES
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- ============================================
-- 3. TABELA DE NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. TABELAS CORE (WORKOUTS, EXERCISES, ETC)
-- ============================================

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
    status TEXT NOT NULL DEFAULT 'pending',
    PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows ADD CONSTRAINT IF NOT EXISTS follows_status_check CHECK (status IN ('pending', 'accepted'));
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

-- ============================================
-- 5. APP LOGS
-- ============================================
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
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.app_logs;
CREATE POLICY "Anyone can insert logs" ON public.app_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own logs" ON public.app_logs;
CREATE POLICY "Users can view own logs" ON public.app_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================
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
  max_attempts INTEGER := 10;
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
    -- Sanitize: remove non-alphanumeric characters
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
      -- Check if it's the username constraint
      counter := counter + 1;
      final_username := base_username || '_' || floor(random() * 10000)::text;
    END;
  END LOOP;

  IF NOT inserted THEN
     RAISE EXCEPTION 'Failed to create profile: Username collision could not be resolved after % attempts', max_attempts;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Raise exception to ensure the auth user creation is rolled back if profile creation fails
  RAISE EXCEPTION 'Unexpected error creating profile for user %: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Workouts indexes
CREATE INDEX IF NOT EXISTS idx_workouts_trainer_id ON public.workouts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workouts_status ON public.workouts(status);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_category ON public.workouts USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_workouts_status_created_at ON public.workouts(status, created_at DESC);

-- Exercises indexes
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON public.exercises(workout_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_workout_id ON public.reviews(workout_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_workout_created ON public.reviews(workout_id, created_at DESC);

-- Progress Logs indexes
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_id ON public.progress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_workout_id ON public.progress_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_date ON public.progress_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_date ON public.progress_logs(user_id, date DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON public.follows(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_following_status ON public.follows(following_id, status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(
  LEAST(sender_id, receiver_id), 
  GREATEST(sender_id, receiver_id), 
  created_at DESC
);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_trainer_id ON public.assignments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_workout_id ON public.assignments(workout_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_user_status ON public.assignments(user_id, status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) 
  WHERE read_at IS NULL;

-- Profiles indexes (for search and lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower ON public.profiles(LOWER(full_name));

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);

-- Full-text search indexes (for better search performance)
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles 
  USING GIN(to_tsvector('portuguese', COALESCE(full_name, '') || ' ' || COALESCE(username, '') || ' ' || COALESCE(bio, '')));

CREATE INDEX IF NOT EXISTS idx_workouts_search ON public.workouts 
  USING GIN(to_tsvector('portuguese', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Analyze tables to update statistics
ANALYZE public.workouts;
ANALYZE public.exercises;
ANALYZE public.reviews;
ANALYZE public.progress_logs;
ANALYZE public.follows;
ANALYZE public.messages;
ANALYZE public.assignments;
ANALYZE public.notifications;
ANALYZE public.profiles;

-- ============================================
-- SETUP COMPLETO!
-- ============================================
-- Todas as tabelas, políticas, triggers e índices foram criados.
-- O banco de dados está pronto para uso.
-- ============================================

