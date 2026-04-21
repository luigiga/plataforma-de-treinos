import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

const useAuthMock = vi.fn()
const toastErrorMock = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('sonner', () => ({
  toast: { error: toastErrorMock },
}))

vi.mock('./Loading', () => ({
  Loading: () => <div>loading</div>,
}))

function LocationEcho({ label }: { label: string }) {
  const location = useLocation()
  return <div>{`${label}:${location.pathname}${location.search}`}</div>
}

afterEach(() => {
  useAuthMock.mockReset()
  toastErrorMock.mockReset()
})

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to auth with redirect param', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/dashboard?tab=overview']}>
        <Routes>
          <Route path="/auth" element={<LocationEcho label="auth" />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><div>content</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByText('auth:/auth?tab=login&redirect=%2Fdashboard%3Ftab%3Doverview'),
    ).toBeInTheDocument()
  })

  it('allows public auth route when logged out', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route
            path="/auth"
            element={<ProtectedRoute redirectIfAuthenticated><div>auth form</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('auth form')).toBeInTheDocument()
  })

  it('redirects logged in users away from auth route', () => {
    useAuthMock.mockReturnValue({
      user: { id: '1', username: 'trainer', full_name: 'Trainer', name: 'Trainer', email: 't@example.com', role: 'trainer' },
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route
            path="/auth"
            element={<ProtectedRoute redirectIfAuthenticated><div>auth form</div></ProtectedRoute>}
          />
          <Route path="/trainer-dashboard" element={<LocationEcho label="trainer" />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('trainer:/trainer-dashboard')).toBeInTheDocument()
  })

  it('redirects unauthorized users and shows toast', async () => {
    useAuthMock.mockReturnValue({
      user: { id: '2', username: 'sub', full_name: 'Sub', name: 'Sub', email: 's@example.com', role: 'subscriber' },
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/trainer-dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<LocationEcho label="dashboard" />} />
          <Route
            path="/trainer-dashboard"
            element={<ProtectedRoute allowedRoles={['trainer']}><div>trainer</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('dashboard:/dashboard')).toBeInTheDocument()

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('Acesso não autorizado.'))
  })
})
