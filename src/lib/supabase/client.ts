// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { USE_MOCKS } from '@/lib/config'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || ''

// Em modo mock usamos placeholders para o client não quebrar no import.
const url = USE_MOCKS
  ? SUPABASE_URL || 'http://localhost:54321'
  : SUPABASE_URL
const key = USE_MOCKS
  ? SUPABASE_PUBLISHABLE_KEY || 'mock-anon-key'
  : SUPABASE_PUBLISHABLE_KEY

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: localStorage,
    persistSession: !USE_MOCKS,
    autoRefreshToken: !USE_MOCKS,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
})
