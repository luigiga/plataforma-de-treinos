/**
 * Feature flags de ambiente para desenvolvimento local.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const PAYMENTS_ENABLED =
  !USE_MOCKS && Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const HAS_SUPABASE =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
