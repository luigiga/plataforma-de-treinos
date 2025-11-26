import { logService, LogLevel } from '@/services/logService'

export const logger = {
  log: (level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${level.toUpperCase()}] ${timestamp} - ${message}`

    // Always log to console for immediate feedback
    if (data) {
      console[level](logMessage, data)
    } else {
      console[level](logMessage)
    }

    // Log to backend for persistence
    // We don't await this to not block the execution
    logService.log(level, message, data)
  },
  info: (message: string, data?: any) => logger.log('info', message, data),
  warn: (message: string, data?: any) => logger.log('warn', message, data),
  error: (message: string, error?: any) => logger.log('error', message, error),
}
