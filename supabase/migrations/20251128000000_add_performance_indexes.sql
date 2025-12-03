-- ============================================
-- PERFORMANCE INDEXES FOR SCALABILITY
-- ============================================
-- These indexes are critical for query performance as data grows
-- Without them, queries will become 10-100x slower with more data

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

