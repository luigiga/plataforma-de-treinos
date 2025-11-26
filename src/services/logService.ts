import { supabase } from '@/lib/supabase/client'

export type LogLevel = 'info' | 'warn' | 'error'

export const logService = {
  async log(level: LogLevel, message: string, data?: any) {
    try {
      // Get current user if available
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // We use a separate table for logs
      // Using 'as any' to bypass type check since app_logs is not in the generated types yet
      await supabase.from('app_logs' as any).insert({
        level,
        message,
        data: data ? data : null,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        user_id: userId,
      })
    } catch (e) {
      // Fallback to console if supabase logging fails to avoid infinite loops
      console.error('Failed to log to Supabase:', e)
    }
  },
}
