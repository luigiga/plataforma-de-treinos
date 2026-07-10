import { afterEach, describe, expect, it, vi } from 'vitest'
import { MOCK_PASSWORD } from './fixtures'
import { mockStore } from './store'

afterEach(() => {
  mockStore.reset()
  sessionStorage.clear()
})

describe('mockStore session', () => {
  it('logs in with demo credentials', () => {
    const result = mockStore.login('admin@demo.local', MOCK_PASSWORD)

    expect(result.error).toBeNull()
    expect(result.user?.email).toBe('admin@demo.local')
    expect(result.user?.role).toBe('admin')
    expect(mockStore.getSessionUserId()).toBe(result.user?.id)
  })

  it('fails with wrong password', () => {
    const result = mockStore.login('admin@demo.local', 'wrong-password')

    expect(result.user).toBeNull()
    expect(result.error?.message).toMatch(/senha/i)
    expect(mockStore.getSessionUserId()).toBeNull()
  })

  it('roundtrips setSessionUserId + getUserById (reload simulation)', () => {
    const login = mockStore.login('aluno@demo.local', MOCK_PASSWORD)
    expect(login.user).not.toBeNull()

    const sessionId = mockStore.getSessionUserId()
    expect(sessionId).toBe(login.user!.id)

    // Simulate page reload: session id persists, user is rehydrated by id
    const restored = mockStore.getUserById(sessionId!)
    expect(restored?.id).toBe(login.user!.id)
    expect(restored?.email).toBe('aluno@demo.local')
    expect(restored?.role).toBe('subscriber')
  })

  it('logout clears session and notifies subscribers', () => {
    mockStore.login('trainer@demo.local', MOCK_PASSWORD)
    expect(mockStore.getSessionUserId()).not.toBeNull()

    const listener = vi.fn()
    const unsubscribe = mockStore.subscribe(listener)

    mockStore.logout()

    expect(mockStore.getSessionUserId()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })
})
