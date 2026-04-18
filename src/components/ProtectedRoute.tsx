import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loading } from './Loading'
import { toast } from 'sonner'
import {
  buildAuthSearchParams,
  getDefaultDashboardPath,
  sanitizeRedirectPath,
} from '@/lib/auth-routing'

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

  const safeRedirectTo = sanitizeRedirectPath(redirectTo)
  const isUnauthorized = !!user && !!allowedRoles && !allowedRoles.includes(user.role)

  useEffect(() => {
    if (isUnauthorized) {
      toast.error('Acesso não autorizado.')
    }
  }, [isUnauthorized])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <Loading />
  }

  // Página pública que deve redirecionar se já estiver autenticado
  if (redirectIfAuthenticated) {
    if (user) {
      const targetPath = safeRedirectTo || getDefaultDashboardPath(user.role)
      return <Navigate to={targetPath} replace />
    }

    return <>{children}</>
  }

  // Se não está autenticado e a rota requer autenticação
  if (!user) {
    if (safeRedirectTo) {
      return <Navigate to={safeRedirectTo} replace />
    }

    // Salvar a rota que tentou acessar para redirecionar após login
    const from = `${location.pathname}${location.search}${location.hash}`
    const authParams = buildAuthSearchParams({
      tab: 'login',
      redirect: from,
    })

    return <Navigate to={`/auth?${authParams.toString()}`} replace />
  }

  // Se há restrição de roles e o usuário não tem permissão
  if (isUnauthorized) {
    const targetPath = getDefaultDashboardPath(user.role)
    return <Navigate to={targetPath} replace />
  }

  // Tudo certo, renderizar o conteúdo
  return <>{children}</>
}
