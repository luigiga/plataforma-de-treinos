import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicProfile from './PublicProfile'

vi.mock('@/lib/config', () => ({
  USE_MOCKS: true,
  PAYMENTS_ENABLED: false,
  HAS_SUPABASE: false,
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('@/context/DataContext', () => ({
  useData: () => ({
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
    isFollowing: () => false,
    isPending: () => false,
  }),
}))

describe('PublicProfile mock mode', () => {
  it('loads mock trainer profile by username', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/ana_trainer']}>
        <Routes>
          <Route path="/profile/:username" element={<PublicProfile />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    })
    expect(screen.getByText('@ana_trainer')).toBeInTheDocument()
  })
})
