import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/config', () => ({
  USE_MOCKS: true,
  PAYMENTS_ENABLED: false,
  HAS_SUPABASE: false,
}))

import { socialService } from './social'

describe('socialService mock mode', () => {
  it('paginates follows without calling supabase', async () => {
    const result = await socialService.fetchFollowsPaginated(
      'mock-trainer-1',
      'followers',
      { page: 1, pageSize: 10 },
    )

    expect(result.total).toBeGreaterThan(0)
    expect(result.data.every((item) => item.followingId === 'mock-trainer-1')).toBe(
      true,
    )
  })
})
