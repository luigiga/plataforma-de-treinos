import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import EmailConfirm from './EmailConfirm'

const {
  useAuthMock,
  loggerErrorMock,
  exchangeCodeForSessionMock,
  verifyOtpMock,
  setSessionMock,
  getSessionMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  exchangeCodeForSessionMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  setSessionMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerErrorMock,
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
      setSession: setSessionMock,
      getSession: getSessionMock,
    },
  },
}))

function LocationEcho() {
  const location = useLocation()
  return <div>{`loc:${location.pathname}${location.search}`}</div>
}

afterEach(() => {
  useAuthMock.mockReset()
  loggerErrorMock.mockReset()
  exchangeCodeForSessionMock.mockReset()
  verifyOtpMock.mockReset()
  setSessionMock.mockReset()
  getSessionMock.mockReset()
  window.location.hash = ''
})

describe('EmailConfirm page', () => {
  it('exchanges code for session and redirects to the right dashboard', async () => {
    useAuthMock.mockReturnValue({ user: null })
    exchangeCodeForSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            user_metadata: {
              role: 'trainer',
            },
          },
        },
      },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/auth/confirm?code=abc']}>
        <Routes>
          <Route path="/auth/confirm" element={<EmailConfirm />} />
          <Route path="/trainer-dashboard" element={<LocationEcho />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('abc')
      expect(
        screen.getByText('Email confirmado com sucesso! Redirecionando...'),
      ).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('loc:/trainer-dashboard')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('verifies token hash and redirects to login when no session is returned', async () => {
    useAuthMock.mockReturnValue({ user: null })
    verifyOtpMock.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/auth/confirm?token_hash=hash123&type=signup']}>
        <Routes>
          <Route path="/auth/confirm" element={<EmailConfirm />} />
          <Route path="/auth" element={<LocationEcho />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        token_hash: 'hash123',
        type: 'signup',
      })
      expect(
        screen.getByText('Email confirmado! Faça login para continuar.'),
      ).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('loc:/auth?tab=login')).toBeInTheDocument()
    }, { timeout: 2500 })
  })

  it('shows error state when confirmation fails', async () => {
    useAuthMock.mockReturnValue({ user: null })
    exchangeCodeForSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: 'invalid or expired token' },
    })

    render(
      <MemoryRouter initialEntries={['/auth/confirm?code=bad']}>
        <Routes>
          <Route path="/auth/confirm" element={<EmailConfirm />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Erro na confirmação')).toBeInTheDocument()
      expect(
        screen.getByText('invalid or expired token'),
      ).toBeInTheDocument()
    })

    expect(loggerErrorMock).toHaveBeenCalled()
  })
})
