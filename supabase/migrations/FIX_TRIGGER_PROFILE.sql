-- ============================================
-- SCRIPT PARA VERIFICAR E CORRIGIR O TRIGGER
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se o trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar se a função existe
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
  AND routine_schema = 'public';

-- 3. Remover trigger antigo se existir (para recriar)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Recriar a função handle_new_user com tratamento robusto de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
        NEW.id,
        final_username,
        full_name_val,
        avatar_url_val,
        NEW.email,
        role_val,
        bio_val,
        metadata_val,
        status_val
      );
      inserted := TRUE;
    EXCEPTION 
      WHEN unique_violation THEN
        -- Check if it's the username constraint
        IF SQLERRM LIKE '%username%' OR SQLERRM LIKE '%profiles_username_key%' THEN
          counter := counter + 1;
          final_username := base_username || '_' || floor(random() * 10000)::text;
        ELSE
          -- If it's a different unique violation (like id), re-raise
          RAISE;
        END IF;
      WHEN OTHERS THEN
        -- Log the error but don't fail silently
        RAISE EXCEPTION 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
  END LOOP;

  IF NOT inserted THEN
     RAISE EXCEPTION 'Failed to create profile: Username collision could not be resolved after % attempts for user %', max_attempts, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar se foi criado corretamente
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Para usuários que já existem mas não têm perfil, criar manualmente
-- (Execute apenas se necessário)
/*
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    BEGIN
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
      ) VALUES (
        user_record.id,
        COALESCE(
          user_record.raw_user_meta_data->>'username',
          split_part(user_record.email, '@', 1)
        ),
        COALESCE(
          user_record.raw_user_meta_data->>'full_name',
          user_record.raw_user_meta_data->>'name',
          ''
        ),
        COALESCE(user_record.raw_user_meta_data->>'avatar_url', ''),
        user_record.email,
        COALESCE(user_record.raw_user_meta_data->>'role', 'subscriber'),
        COALESCE(user_record.raw_user_meta_data->>'bio', ''),
        COALESCE(user_record.raw_user_meta_data->>'metadata', '{}'::jsonb),
        COALESCE(user_record.raw_user_meta_data->>'status', 'active')
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
END $$;
*/

