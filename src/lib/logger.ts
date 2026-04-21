import { logService, LogLevel } from '@/services/logService'

const consoleMethods: Record<LogLevel, (...args: unknown[]) => void> = {
  info: console.info,
  warn: console.warn,
  error: console.error,
}

function shouldPersistLog(level: LogLevel) {
  return import.meta.env.PROD && (level === 'warn' || level === 'error')
}

export const logger = {
  log: (level: LogLevel, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${level.toUpperCase()}] ${timestamp} - ${message}`

    const consoleMethod = consoleMethods[level] || console.log
    if (typeof data !== 'undefined') {
      consoleMethod(logMessage, data)
    } else {
      consoleMethod(logMessage)
    }

    if (shouldPersistLog(level)) {
      void logService.log(level, message, data)
    }
  },
  info: (message: string, data?: unknown) => logger.log('info', message, data),
  warn: (message: string, data?: unknown) => logger.log('warn', message, data),
  error: (message: string, error?: unknown) => logger.log('error', message, error),
}
