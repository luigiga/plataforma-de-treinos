-- ============================================
-- SCRIPT PARA CRIAR PERFIL PARA USUÁRIO EXISTENTE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Criar perfil para o usuário específico que está faltando
-- Substitua o ID abaixo pelo ID do seu usuário se necessário

DO $$
DECLARE
  user_id UUID := 'c69ce7bf-dc3f-4bab-99fb-4364ae09dfa3';
  user_record RECORD;
  username_val TEXT;
  full_name_val TEXT;
  avatar_url_val TEXT;
  role_val TEXT;
BEGIN
  -- Buscar informações do usuário
  SELECT 
    id, 
    email, 
    raw_user_meta_data,
    created_at
  INTO user_record
  FROM auth.users 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with id % not found', user_id;
  END IF;
  
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    RAISE NOTICE 'Profile already exists for user %', user_id;
    RETURN;
  END IF;
  
  -- Extrair valores do metadata
  username_val := COALESCE(
    user_record.raw_user_meta_data->>'username',
    split_part(user_record.email, '@', 1)
  );
  
  full_name_val := COALESCE(
    user_record.raw_user_meta_data->>'full_name',
    user_record.raw_user_meta_data->>'name',
    ''
  );
  
  avatar_url_val := COALESCE(
    user_record.raw_user_meta_data->>'avatar_url',
    ''
  );
  
  role_val := COALESCE(
    user_record.raw_user_meta_data->>'role',
    'subscriber'
  );
  
  -- Criar o perfil
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    email,
    role,
    bio,
    metadata,
    status,
    created_at
  ) VALUES (
    user_record.id,
    username_val,
    full_name_val,
    avatar_url_val,
    user_record.email,
    role_val,
    COALESCE(user_record.raw_user_meta_data->>'bio', ''),
    COALESCE(user_record.raw_user_meta_data->>'metadata', '{}'::jsonb),
    COALESCE(user_record.raw_user_meta_data->>'status', 'active'),
    user_record.created_at
  );
  
  RAISE NOTICE 'Profile created successfully for user %', user_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create profile for user %: %', user_id, SQLERRM;
END $$;

-- Verificar se foi criado
SELECT * FROM profiles WHERE id = 'c69ce7bf-dc3f-4bab-99fb-4364ae09dfa3';

