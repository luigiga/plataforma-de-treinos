import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'

export type LogLevel = 'info' | 'warn' | 'error'

let cachedUserId: string | null | undefined
let authCacheInitialized = false

function normalizeLogData(data: unknown): Json | null {
  if (typeof data === 'undefined') return null

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    }
  }

  if (
    data === null ||
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return data
  }

  try {
    return JSON.parse(JSON.stringify(data)) as Json
  } catch {
    return String(data)
  }
}

function initAuthUserCache() {
  if (authCacheInitialized || typeof window === 'undefined') {
    return
  }

  authCacheInitialized = true

  void supabase.auth.getSession().then(({ data }) => {
    cachedUserId = data.session?.user?.id ?? null
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null
  })
}

async function getCurrentUserId() {
  initAuthUserCache()

  if (typeof cachedUserId !== 'undefined') {
    return cachedUserId
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  cachedUserId = session?.user?.id ?? null
  return cachedUserId
}

export const logService = {
  async log(level: LogLevel, message: string, data?: unknown) {
    try {
      const userId = await getCurrentUserId()

      await supabase.from('app_logs').insert({
        level,
        message,
        data: normalizeLogData(data),
        url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: new Date().toISOString(),
        user_id: userId,
      })
    } catch (error) {
      console.error('Failed to log to Supabase:', error)
    }
  },
}
