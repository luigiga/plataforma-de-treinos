import { toast } from 'sonner'
import { logger } from './logger'

export interface NetworkError {
  message: string
  code?: string
  status?: number
  isNetworkError?: boolean
  isOffline?: boolean
}

/**
 * Verifica se um erro é relacionado a rede/offline
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false
  
  // Erros de conexão
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.message?.includes('Network request failed')) {
    return true
  }

  // Erros de timeout
  if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
    return true
  }

  // Status codes de erro de rede
  if (error.status === 0 || error.status === 408 || error.status === 504) {
    return true
  }

  // Verificar se está offline
  if (!navigator.onLine) {
    return true
  }

  return false
}

/**
 * Trata erros de forma centralizada, retornando mensagem amigável
 */
export function handleError(error: any, defaultMessage = 'Ocorreu um erro. Tente novamente.'): NetworkError {
  const networkError: NetworkError = {
    message: defaultMessage,
    isNetworkError: false,
    isOffline: !navigator.onLine,
  }

  if (isNetworkError(error)) {
    networkError.isNetworkError = true
    networkError.isOffline = !navigator.onLine
    
    if (networkError.isOffline) {
      networkError.message = 'Você está offline. Verifique sua conexão e tente novamente.'
    } else {
      networkError.message = 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
  } else if (error?.message) {
    networkError.message = error.message
  } else if (typeof error === 'string') {
    networkError.message = error
  }

  // Extrair código e status se disponível
  if (error?.code) networkError.code = error.code
  if (error?.status) networkError.status = error.status

  return networkError
}

/**
 * Trata erro e exibe toast com mensagem apropriada
 */
export function handleErrorWithToast(
  error: any,
  defaultMessage = 'Ocorreu um erro. Tente novamente.',
  logError = true
): NetworkError {
  const handledError = handleError(error, defaultMessage)

  if (logError) {
    logger.error('Error handled', {
      error: handledError,
      originalError: error,
    })
  }

  toast.error(handledError.message)

  return handledError
}

/**
 * Wrapper para funções assíncronas com tratamento de erro automático
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  onError?: (error: NetworkError) => void
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const handledError = handleError(error, errorMessage)
    
    if (onError) {
      onError(handledError)
    } else {
      handleErrorWithToast(error, errorMessage)
    }
    
    return null
  }
}

