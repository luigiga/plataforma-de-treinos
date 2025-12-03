import { QueryClient } from '@tanstack/react-query'
import { isNetworkError } from './error-handler'

/**
 * QueryClient configurado com opções otimizadas para performance
 * - Cache de 5 minutos para dados estáticos
 * - Refetch automático desabilitado (evita requisições desnecessárias)
 * - Retry configurado para falhas de rede
 * - Tratamento inteligente de erros offline
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Manter dados em cache por 10 minutos mesmo quando não usado
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      // Não refetch automaticamente quando a janela ganha foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta (útil para quando volta online)
      refetchOnReconnect: true,
      // Retry apenas se não for erro de rede/offline
      retry: (failureCount, error) => {
        // Não retry se estiver offline ou for erro de rede
        if (!navigator.onLine || isNetworkError(error)) {
          return false
        }
        // Retry até 2 vezes para outros erros
        return failureCount < 2
      },
      // Tempo entre retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations apenas se não for erro de rede
      retry: (failureCount, error) => {
        if (!navigator.onLine || isNetworkError(error)) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

