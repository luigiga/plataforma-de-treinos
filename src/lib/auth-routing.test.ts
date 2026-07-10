import { describe, expect, it } from 'vitest'
import {
  canRoleAccessPath,
  getDefaultDashboardPath,
  resolvePostAuthPath,
} from './auth-routing'

describe('getDefaultDashboardPath', () => {
  it('returns role-specific dashboards', () => {
    expect(getDefaultDashboardPath('admin')).toBe('/admin-dashboard')
    expect(getDefaultDashboardPath('trainer')).toBe('/trainer-dashboard')
    expect(getDefaultDashboardPath('subscriber')).toBe('/dashboard')
    expect(getDefaultDashboardPath(null)).toBe('/auth?tab=login')
    expect(getDefaultDashboardPath(undefined)).toBe('/auth?tab=login')
  })
})

describe('resolvePostAuthPath', () => {
  it('ignores incompatible redirects and falls back to role dashboard', () => {
    expect(resolvePostAuthPath('admin', '/dashboard')).toBe('/admin-dashboard')
    expect(resolvePostAuthPath('trainer', '/dashboard')).toBe(
      '/trainer-dashboard',
    )
    expect(resolvePostAuthPath('subscriber', '/admin-dashboard')).toBe(
      '/dashboard',
    )
  })

  it('allows compatible redirects for any authenticated role', () => {
    expect(resolvePostAuthPath('admin', '/profile')).toBe('/profile')
    expect(resolvePostAuthPath('trainer', '/social')).toBe('/social')
    expect(resolvePostAuthPath('subscriber', '/profile/carla_aluno')).toBe(
      '/profile/carla_aluno',
    )
  })
})

describe('canRoleAccessPath', () => {
  it('enforces role rules on key routes', () => {
    expect(canRoleAccessPath('admin', '/admin-dashboard')).toBe(true)
    expect(canRoleAccessPath('trainer', '/admin-dashboard')).toBe(false)
    expect(canRoleAccessPath('subscriber', '/admin-dashboard')).toBe(false)

    expect(canRoleAccessPath('trainer', '/trainer-dashboard')).toBe(true)
    expect(canRoleAccessPath('admin', '/trainer-dashboard')).toBe(false)
    expect(canRoleAccessPath('subscriber', '/trainer-dashboard')).toBe(false)

    expect(canRoleAccessPath('subscriber', '/dashboard')).toBe(true)
    expect(canRoleAccessPath('admin', '/dashboard')).toBe(false)
    expect(canRoleAccessPath('trainer', '/dashboard')).toBe(false)

    expect(canRoleAccessPath('subscriber', '/progress')).toBe(true)
    expect(canRoleAccessPath('admin', '/progress')).toBe(false)

    expect(canRoleAccessPath('trainer', '/create-workout')).toBe(true)
    expect(canRoleAccessPath('admin', '/create-workout')).toBe(true)
    expect(canRoleAccessPath('subscriber', '/create-workout')).toBe(false)

    expect(canRoleAccessPath('trainer', '/trainer/client/1')).toBe(true)
    expect(canRoleAccessPath('admin', '/trainer/client/1')).toBe(false)

    expect(canRoleAccessPath('admin', '/profile')).toBe(true)
    expect(canRoleAccessPath('trainer', '/social')).toBe(true)
  })
})
