import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loading } from './Loading'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: ReactNode
  /**
   * Roles permitidos para acessar esta rota
   * Se não especificado, qualquer usuário autenticado pode acessar
   */
  allowedRoles?: ('subscriber' | 'trainer' | 'admin')[]
  /**
   * Se true, redireciona usuários autenticados para o dashboard apropriado
   * Útil para páginas públicas que não devem ser acessadas quando logado (ex: /auth)
   */
  redirectIfAuthenticated?: boolean
  /**
   * URL para redirecionar se não autenticado
   */
  redirectTo?: string
}

/**
 * Componente para proteger rotas que requerem autenticação
 * 
 * @example
 * // Proteger rota para qualquer usuário autenticado
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Proteger rota apenas para admins
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Página pública que redireciona se já estiver logado
 * <ProtectedRoute redirectIfAuthenticated redirectTo="/dashboard">
 *   <Auth />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectIfAuthenticated = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <Loading />
  }

  // Se redirectIfAuthenticated está ativo e usuário está autenticado
  if (redirectIfAuthenticated && user) {
    // Redirecionar para dashboard apropriado ou URL especificada
    const targetPath = redirectTo || getDefaultDashboardPath(user.role)
    return <Navigate to={targetPath} replace />
  }

  // Se não está autenticado e a rota requer autenticação
  if (!user) {
    // Salvar a rota que tentou acessar para redirecionar após login
    const from = location.pathname + location.search
    return (
      <Navigate
        to={redirectTo || `/auth?tab=login&redirect=${encodeURIComponent(from)}`}
        replace
      />
    )
  }

  // Se há restrição de roles e o usuário não tem permissão
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error('Acesso não autorizado.')
    const targetPath = getDefaultDashboardPath(user.role)
    return <Navigate to={targetPath} replace />
  }

  // Tudo certo, renderizar o conteúdo
  return <>{children}</>
}

/**
 * Retorna o caminho do dashboard padrão baseado no role do usuário
 */
function getDefaultDashboardPath(role: 'subscriber' | 'trainer' | 'admin'): string {
  switch (role) {
    case 'admin':
      return '/admin-dashboard'
    case 'trainer':
      return '/trainer-dashboard'
    case 'subscriber':
    default:
      return '/dashboard'
  }
}

