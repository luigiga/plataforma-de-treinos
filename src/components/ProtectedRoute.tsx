import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  getDefaultDashboardPath,
  resolvePostAuthPath,
  sanitizeRedirectPath,
} from '@/lib/auth-routing'
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

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectIfAuthenticated = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const safeRedirectTo = sanitizeRedirectPath(redirectTo)
  const isUnauthorized =
    !!user && !!allowedRoles && !allowedRoles.includes(user.role)

  useEffect(() => {
    if (isUnauthorized) {
      toast.error('Acesso não autorizado.')
    }
  }, [isUnauthorized])

  if (loading) {
    return <Loading />
  }

  // Página pública que redireciona apenas se já estiver autenticado
  if (redirectIfAuthenticated) {
    if (user) {
      const redirectFromQuery = new URLSearchParams(location.search).get(
        'redirect',
      )
      const targetPath =
        safeRedirectTo ||
        resolvePostAuthPath(user.role, redirectFromQuery)
      return <Navigate to={targetPath} replace />
    }

    return <>{children}</>
  }

  // Rota protegida sem usuário autenticado
  if (!user) {
    if (safeRedirectTo) {
      return <Navigate to={safeRedirectTo} replace />
    }

    const from = sanitizeRedirectPath(
      `${location.pathname}${location.search}${location.hash}`,
    )

    // Evita loop: não devolver o usuário para a mesma rota protegida
    // logo após logout (especialmente /admin-dashboard).
    const redirectParam =
      from && from !== '/'
        ? `&redirect=${encodeURIComponent(from)}`
        : ''

    return <Navigate to={`/auth?tab=login${redirectParam}`} replace />
  }

  // Usuário autenticado, mas sem permissão
  if (isUnauthorized) {
    const targetPath = getDefaultDashboardPath(user.role)
    return <Navigate to={targetPath} replace />
  }

  return <>{children}</>
}
