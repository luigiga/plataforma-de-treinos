import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MOCK_PASSWORD } from './fixtures'
import { mockStore } from './store'
import { workoutService } from '@/services/workouts'
import { socialService } from '@/services/social'
import { searchService } from '@/services/search'
import { accessService } from '@/services/payments/access'
import { profileService } from '@/services/profile'
import { resolvePostAuthPath } from '@/lib/auth-routing'

vi.mock('@/lib/config', () => ({
  USE_MOCKS: true,
  PAYMENTS_ENABLED: false,
  HAS_SUPABASE: false,
}))

beforeEach(() => {
  mockStore.reset()
})

afterEach(() => {
  mockStore.reset()
})

describe('mock flows — auth & routing', () => {
  it('logs in each demo persona to the correct dashboard path', () => {
    const cases = [
      { email: 'aluno@demo.local', role: 'subscriber', path: '/dashboard' },
      { email: 'trainer@demo.local', role: 'trainer', path: '/trainer-dashboard' },
      { email: 'admin@demo.local', role: 'admin', path: '/admin-dashboard' },
    ] as const

    for (const item of cases) {
      mockStore.reset()
      const result = mockStore.login(item.email, MOCK_PASSWORD)
      expect(result.error).toBeNull()
      expect(result.user?.role).toBe(item.role)
      expect(resolvePostAuthPath(result.user!.role, '/dashboard')).toBe(
        item.role === 'subscriber' ? '/dashboard' : item.path,
      )
      expect(resolvePostAuthPath(result.user!.role, null)).toBe(item.path)
    }
  })

  it('registers a new subscriber and keeps session', () => {
    const result = mockStore.register('novo@demo.local', MOCK_PASSWORD, {
      username: 'novo_user',
      name: 'Novo User',
      role: 'subscriber',
    })

    expect(result.error).toBeNull()
    expect(result.user?.username).toBe('novo_user')
    expect(mockStore.getSessionUserId()).toBe(result.user?.id)
    expect(mockStore.isUsernameAvailable('novo_user')).toBe(false)
  })
})

describe('mock flows — workouts & access', () => {
  it('lists published workouts for subscriber dashboard', async () => {
    const page = await workoutService.fetchWorkoutsPaginated({
      page: 1,
      pageSize: 12,
    })

    expect(page.total).toBeGreaterThanOrEqual(3)
    expect(page.data.every((w) => w.status === 'published')).toBe(true)
    expect(page.data.some((w) => w.title.includes('Full Body'))).toBe(true)
  })

  it('lists trainer workouts including drafts', async () => {
    const page = await workoutService.fetchWorkoutsByTrainerPaginated(
      'mock-trainer-1',
      { page: 1, pageSize: 20 },
    )

    expect(page.data.some((w) => w.id === 'workout-1')).toBe(true)
    expect(page.data.some((w) => w.id === 'workout-2')).toBe(true)
  })

  it('creates, updates and deletes a workout in memory', async () => {
    const created = await workoutService.createWorkout({
      trainerId: 'mock-trainer-1',
      title: 'Treino Teste QA',
      description: 'Criado pelo teste',
      image: 'https://example.com/w.jpg',
      duration: 40,
      difficulty: 'Iniciante',
      category: ['Força'],
      exercises: [
        {
          id: 'ex-qa-1',
          name: 'Flexão',
          sets: '3',
          reps: '12',
          instructions: 'Controle a descida',
        },
      ],
      status: 'published',
      isCircuit: false,
      isPaid: false,
      purchaseType: 'free',
    })

    expect(created.id).toBeTruthy()
    expect(mockStore.getWorkoutById(created.id)?.title).toBe('Treino Teste QA')

    mockStore.updateWorkout(created.id, { title: 'Treino Teste QA Editado' })
    expect(mockStore.getWorkoutById(created.id)?.title).toBe(
      'Treino Teste QA Editado',
    )

    await workoutService.deleteWorkout(created.id)
    expect(mockStore.getWorkoutById(created.id)).toBeNull()
  })

  it('grants workout access in mock mode for free and paid workouts', async () => {
    const free = await accessService.checkWorkoutAccess(
      'mock-sub-1',
      'workout-1',
      'mock-trainer-1',
      'free',
      false,
    )
    const paid = await accessService.checkWorkoutAccess(
      'mock-sub-1',
      'workout-3',
      'mock-trainer-2',
      'one_time',
      true,
    )

    expect(free.hasAccess).toBe(true)
    expect(paid.hasAccess).toBe(true)
  })
})

describe('mock flows — social, search, progress, admin', () => {
  it('follows and accepts follow requests', async () => {
    await socialService.follow('mock-sub-2', 'mock-trainer-2')
    expect(
      mockStore
        .listFollows()
        .some(
          (f) =>
            f.followerId === 'mock-sub-2' &&
            f.followingId === 'mock-trainer-2' &&
            f.status === 'pending',
        ),
    ).toBe(true)

    await socialService.acceptFollow('mock-sub-2', 'mock-trainer-2')
    expect(
      mockStore
        .listFollows()
        .some(
          (f) =>
            f.followerId === 'mock-sub-2' &&
            f.followingId === 'mock-trainer-2' &&
            f.status === 'accepted',
        ),
    ).toBe(true)
  })

  it('searches profiles and workouts globally', async () => {
    const results = await searchService.searchGlobal('Ana')
    expect(results.some((r) => r.type === 'profile')).toBe(true)

    const workouts = await searchService.searchGlobal('Full Body')
    expect(workouts.some((r) => r.type === 'workout')).toBe(true)
  })

  it('records progress and reviews', () => {
    mockStore.addProgressLog({
      userId: 'mock-sub-1',
      workoutId: 'workout-1',
      workoutTitle: 'Full Body Força',
      date: new Date().toISOString(),
      duration: 45,
      notes: 'QA progress',
    })
    expect(
      mockStore.listProgressLogs('mock-sub-1').some((p) => p.notes === 'QA progress'),
    ).toBe(true)

    mockStore.addReview({
      workoutId: 'workout-1',
      userId: 'mock-sub-1',
      userName: 'Carla Mendes',
      userAvatar: '',
      rating: 5,
      comment: 'Review QA',
    })
    expect(
      mockStore
        .listReviews('workout-1')
        .data.some((r) => r.comment === 'Review QA'),
    ).toBe(true)
  })

  it('admin can list, toggle and delete users via profileService', async () => {
    const listed = await profileService.getAllProfilesPaginated({
      page: 1,
      pageSize: 20,
    })
    expect(listed.total).toBeGreaterThanOrEqual(5)

    const target = mockStore.getUserByEmail('diego@demo.local')
    expect(target).not.toBeNull()

    mockStore.toggleUserStatus(target!.id)
    expect(mockStore.getUserById(target!.id)?.status).toBe('inactive')

    await profileService.deleteProfile(target!.id)
    expect(mockStore.getUserById(target!.id)).toBeNull()
  })

  it('assigns workout from trainer to subscriber', () => {
    const assignment = mockStore.assignWorkout(
      'mock-sub-2',
      'mock-trainer-1',
      'workout-2',
    )
    expect(assignment.userId).toBe('mock-sub-2')
    expect(
      mockStore
        .listAssignments('mock-sub-2')
        .some((a) => a.workoutId === 'workout-2'),
    ).toBe(true)
  })
})
