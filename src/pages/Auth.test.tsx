import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Auth from './Auth'

const useAuthMock = vi.fn()
const toastErrorMock = vi.fn()
const toastInfoMock = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    info: toastInfoMock,
  },
}))

function LocationEcho() {
  const location = useLocation()
  return <div>{`loc:${location.pathname}${location.search}`}</div>
}

afterEach(() => {
  useAuthMock.mockReset()
  toastErrorMock.mockReset()
  toastInfoMock.mockReset()
})

describe('Auth page', () => {
  it('redirects authenticated users to the requested path', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: '1',
        username: 'trainer',
        full_name: 'Trainer',
        name: 'Trainer',
        email: 'trainer@example.com',
        role: 'trainer',
      },
      login: vi.fn(),
      register: vi.fn(),
      checkUsernameAvailability: vi.fn().mockResolvedValue(true),
    })

    render(
      <MemoryRouter initialEntries={['/auth?tab=login&redirect=%2Fprogress']}>
        <Routes>
          <Route path="/progress" element={<LocationEcho />} />
          <Route path="/auth" element={<><LocationEcho /><Auth /></>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('loc:/progress')).toBeInTheDocument()
    })
  })

  it('preserves redirect and role params when switching tabs', async () => {
    useAuthMock.mockReturnValue({
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      checkUsernameAvailability: vi.fn().mockResolvedValue(true),
    })

    render(
      <MemoryRouter initialEntries={['/auth?tab=login&redirect=%2Fprogress&role=trainer']}>
        <Routes>
          <Route path="/auth" element={<><LocationEcho /><Auth /></>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Cadastrar' }))

    await waitFor(() => {
      expect(
        screen.getByText('loc:/auth?tab=register&redirect=%2Fprogress&role=trainer'),
      ).toBeInTheDocument()
    })
  })

  it('returns to login after registration without session and preserves params', async () => {
    const registerMock = vi.fn().mockResolvedValue({
      error: null,
      data: { session: null },
    })

    useAuthMock.mockReturnValue({
      user: null,
      login: vi.fn(),
      register: registerMock,
      checkUsernameAvailability: vi.fn().mockResolvedValue(true),
    })

    render(
      <MemoryRouter initialEntries={['/auth?tab=register&redirect=%2Fdashboard&role=trainer']}>
        <Routes>
          <Route path="/auth" element={<><LocationEcho /><Auth /></>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'trainer_test' },
    })
    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'Trainer Test' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'trainer@test.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: '123456' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
      target: { value: '123456' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled()
      expect(
        screen.getByText('loc:/auth?tab=login&redirect=%2Fdashboard&role=trainer'),
      ).toBeInTheDocument()
    })

    expect(toastInfoMock).toHaveBeenCalledWith(
      'Verifique seu email para confirmar a conta antes de fazer login',
    )
  })
})
