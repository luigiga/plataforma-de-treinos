import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockAppRoutes } from '@/test/mock-app'
import { mockStore } from './store'
import { MOCK_PASSWORD } from './fixtures'

vi.mock('@/lib/config', () => ({
  USE_MOCKS: true,
  PAYMENTS_ENABLED: false,
  HAS_SUPABASE: false,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

beforeEach(() => {
  mockStore.reset()
  sessionStorage.clear()
})

afterEach(() => {
  mockStore.reset()
  sessionStorage.clear()
})

async function loginAs(label: 'Aluno' | 'Trainer' | 'Admin') {
  const user = userEvent.setup()
  render(<MockAppRoutes initialEntries={['/auth']} />)

  const button = screen.getByRole('button', {
    name: new RegExp(`^${label}\\b`, 'i'),
  })
  await user.click(button)
  return user
}

describe('mock UI flows', () => {
  it('subscriber lands on dashboard with published workouts', async () => {
    await loginAs('Aluno')

    await waitFor(() => {
      expect(screen.getByText(/Olá, Carla Mendes!/i)).toBeInTheDocument()
    })
    // Aparece em "Recomendado" e na grade principal
    expect(screen.getAllByText(/Full Body Força/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Painel Administrativo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Painel do Treinador/i)).not.toBeInTheDocument()
  })

  it('trainer lands on trainer dashboard and sees own workouts', async () => {
    const user = await loginAs('Trainer')

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('tab', { name: /Treinos/i }))

    await waitFor(() => {
      expect(screen.getByText(/Full Body Força/i)).toBeInTheDocument()
      expect(screen.getByText(/Mobilidade Matinal/i)).toBeInTheDocument()
    })
  })

  it('admin lands on admin dashboard with user list', async () => {
    await loginAs('Admin')

    await waitFor(() => {
      expect(screen.getByText(/Painel Administrativo/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/admin@demo.local/i)).toBeInTheDocument()
    expect(screen.getByText(/aluno@demo.local/i)).toBeInTheDocument()
  })

  it('manual login with password also works for trainer', async () => {
    const user = userEvent.setup()
    render(<MockAppRoutes initialEntries={['/auth']} />)

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'trainer@demo.local')
    await user.type(screen.getByPlaceholderText('******'), MOCK_PASSWORD)
    // Navbar também tem "Entrar"; o submit do form é o último
    const entrarButtons = screen.getAllByRole('button', { name: /^Entrar$/i })
    await user.click(entrarButtons[entrarButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })
  })

  it('opens public mock profile', async () => {
    render(<MockAppRoutes initialEntries={['/profile/ana_trainer']} />)

    await waitFor(() => {
      expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    })
    expect(screen.getByText('@ana_trainer')).toBeInTheDocument()
  })

  it('opens workout details with exercises in mock', async () => {
    mockStore.setSessionUserId('mock-sub-1')
    render(<MockAppRoutes initialEntries={['/workout/workout-1']} />)

    await waitFor(() => {
      expect(screen.getByText(/Full Body Força/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Agachamento livre/i)).toBeInTheDocument()
  })

  it('subscriber can open social page when logged in', async () => {
    mockStore.setSessionUserId('mock-sub-1')
    render(<MockAppRoutes initialEntries={['/social']} />)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('seu@email.com')).not.toBeInTheDocument()
    })
  })

  it('blocks subscriber from admin dashboard', async () => {
    mockStore.setSessionUserId('mock-sub-1')
    render(<MockAppRoutes initialEntries={['/admin-dashboard']} />)

    await waitFor(() => {
      expect(screen.getByText(/Olá, Carla Mendes!/i)).toBeInTheDocument()
    })
    expect(screen.getAllByText(/Full Body Força/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Painel Administrativo/i)).not.toBeInTheDocument()
  })

  it('subscriber can open own profile page', async () => {
    mockStore.setSessionUserId('mock-sub-1')
    render(<MockAppRoutes initialEntries={['/profile']} />)

    await waitFor(() => {
      expect(screen.getByText('Carla Mendes')).toBeInTheDocument()
    })
    expect(screen.getByText('@carla_aluno')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument()
  })

  it('subscriber social discover lists public users', async () => {
    mockStore.setSessionUserId('mock-sub-1')
    render(<MockAppRoutes initialEntries={['/social']} />)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Buscar por nome, username ou email/i),
      ).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: /Descobrir/i })).toBeInTheDocument()
    expect(screen.getByText(/Ana Silva/i)).toBeInTheDocument()
  })

  it('subscriber opens workout details from dashboard', async () => {
    const user = await loginAs('Aluno')

    await waitFor(() => {
      expect(screen.getByText(/Olá, Carla Mendes!/i)).toBeInTheDocument()
    })

    const workoutLinks = screen.getAllByRole('link', { name: /Full Body Força/i })
    await user.click(workoutLinks[0])

    await waitFor(() => {
      expect(screen.getByText(/Agachamento livre/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Voltar/i })).toBeInTheDocument()
  })

  it('trainer dashboard exposes create workout action', async () => {
    await loginAs('Trainer')

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /Novo Treino/i })).toBeInTheDocument()
  })

  it('trainer can open create workout and go back to dashboard', async () => {
    const user = await loginAs('Trainer')

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /Novo Treino/i }))

    await waitFor(() => {
      expect(screen.getByText(/Criar Novo Treino/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /^Voltar$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })
  })

  it('trainer cancel on create workout returns to trainer dashboard', async () => {
    const user = await loginAs('Trainer')

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /Novo Treino/i }))

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^Cancelar$/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /^Cancelar$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Painel do Treinador/i)).toBeInTheDocument()
    })
  })

  it('admin create-workout back redirects to admin dashboard', async () => {
    mockStore.setSessionUserId('mock-admin-1')
    render(<MockAppRoutes initialEntries={['/create-workout']} />)

    await waitFor(() => {
      expect(screen.getByText(/Criar Novo Treino/i)).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: /^Voltar$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Painel Administrativo/i)).toBeInTheDocument()
    })
  })

  it('admin can see user management section', async () => {
    await loginAs('Admin')

    await waitFor(() => {
      expect(screen.getAllByText(/Gestão de Usuários/i).length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText(/Total de Usuários/i).length).toBeGreaterThanOrEqual(1)
  })

  it('logout clears session and returns to home', async () => {
    const user = await loginAs('Aluno')

    await waitFor(() => {
      expect(screen.getByText(/Olá, Carla Mendes!/i)).toBeInTheDocument()
    })
    expect(mockStore.getSessionUserId()).toBe('mock-sub-1')

    // Trigger do avatar (desktop): botão circular com fallback da inicial
    const avatarTrigger = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('rounded-full') && btn.textContent?.includes('C'))

    expect(avatarTrigger).toBeTruthy()
    await user.click(avatarTrigger!)

    const logoutItem = await screen.findByText(/^Sair$/i)
    await user.click(logoutItem)

    await waitFor(() => {
      expect(mockStore.getSessionUserId()).toBeNull()
    })
  })
})
