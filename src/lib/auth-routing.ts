export type AppRole = 'subscriber' | 'trainer' | 'admin'

export function getDefaultDashboardPath(role?: AppRole | string | null): string {
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

export function buildAuthSearchParams({
  tab,
  redirect,
  role,
}: {
  tab: 'login' | 'register'
  redirect?: string | null
  role?: string | null
}) {
  const params = new URLSearchParams()
  params.set('tab', tab)

  const safeRedirect = sanitizeRedirectPath(redirect)
  if (safeRedirect) {
    params.set('redirect', safeRedirect)
  }

  if (role) {
    params.set('role', role)
  }

  return params
}
