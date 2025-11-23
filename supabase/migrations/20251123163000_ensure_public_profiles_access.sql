-- Ensure public read access to profiles for the public profile view feature
-- This policy allows anyone (authenticated or anonymous) to read profile data
-- We drop the policy first to ensure we can recreate it correctly without errors if it exists

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);
