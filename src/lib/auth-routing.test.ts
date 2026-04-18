import { describe, expect, it } from 'vitest'
import {
  buildAuthSearchParams,
  getDefaultDashboardPath,
  sanitizeRedirectPath,
} from './auth-routing'

describe('auth routing helpers', () => {
  it('returns the expected default dashboard path for each role', () => {
    expect(getDefaultDashboardPath('subscriber')).toBe('/dashboard')
    expect(getDefaultDashboardPath('trainer')).toBe('/trainer-dashboard')
    expect(getDefaultDashboardPath('admin')).toBe('/admin-dashboard')
    expect(getDefaultDashboardPath(undefined)).toBe('/dashboard')
  })

  it('accepts only safe internal redirect paths', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=overview')).toBe(
      '/dashboard?tab=overview',
    )
    expect(sanitizeRedirectPath('https://example.com')).toBeNull()
    expect(sanitizeRedirectPath('//example.com')).toBeNull()
    expect(sanitizeRedirectPath('dashboard')).toBeNull()
  })

  it('builds auth search params preserving role and redirect', () => {
    const params = buildAuthSearchParams({
      tab: 'login',
      role: 'trainer',
      redirect: '/dashboard?tab=overview',
    })

    expect(params.toString()).toBe(
      'tab=login&redirect=%2Fdashboard%3Ftab%3Doverview&role=trainer',
    )
  })
})
