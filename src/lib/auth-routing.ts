export type AppRole = 'subscriber' | 'trainer' | 'admin'

export function getDefaultDashboardPath(role: AppRole): string {
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

export function sanitizeRedirectPath(path?: string | null): string | null {
  if (!path) return null

  const normalizedPath = path.trim()

  if (!normalizedPath.startsWith('/')) return null
  if (normalizedPath.startsWith('//')) return null

  return normalizedPath
}

/**
 * Rotas com restrição de role. Paths públicos/autenticados genéricos
 * (ex: /profile, /social) são liberados para qualquer role autenticado.
 */
const ROLE_ROUTE_RULES: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: '/admin-dashboard', roles: ['admin'] },
  { prefix: '/trainer-dashboard', roles: ['trainer'] },
  { prefix: '/trainer/client', roles: ['trainer'] },
  { prefix: '/create-workout', roles: ['trainer', 'admin'] },
  { prefix: '/edit-workout', roles: ['trainer', 'admin'] },
  { prefix: '/dashboard', roles: ['subscriber'] },
  { prefix: '/progress', roles: ['subscriber'] },
]

export function canRoleAccessPath(role: AppRole, path: string): boolean {
  const pathname = path.split('?')[0]?.split('#')[0] || path
  const rule = ROLE_ROUTE_RULES.find(
    (item) =>
      pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  )

  if (!rule) return true
  return rule.roles.includes(role)
}

export function resolvePostAuthPath(
  role: AppRole,
  redirect?: string | null,
): string {
  const safeRedirect = sanitizeRedirectPath(redirect)
  if (safeRedirect && canRoleAccessPath(role, safeRedirect)) {
    return safeRedirect
  }
  return getDefaultDashboardPath(role)
}
