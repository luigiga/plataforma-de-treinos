import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { AuthResponse } from '@supabase/supabase-js'
import { AuthContext, type User } from '@/context/AuthContext'
import { mockStore } from './store'

function readSessionUser(): User | null {
  const sessionId = mockStore.getSessionUserId()
  if (!sessionId) return null
  const current = mockStore.getUserById(sessionId)
  return current ? { ...current } : null
}

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Hidrata a sessão no primeiro render para reload em rotas protegidas
  // (ex: /admin-dashboard) não cair no redirect de "não autenticado".
  const [user, setUser] = useState<User | null>(() => readSessionUser())
  const [allUsers, setAllUsers] = useState<User[]>(() =>
    mockStore.users.map((item) => ({ ...item })),
  )
  const [loading, setLoading] = useState(false)

  const syncUsers = useCallback(() => {
    setAllUsers(mockStore.users.map((item) => ({ ...item })))
    setUser(readSessionUser())
  }, [])

  useEffect(() => {
    syncUsers()
    return mockStore.subscribe(syncUsers)
  }, [syncUsers])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const result = mockStore.login(email, password)
    if (result.error || !result.user) {
      setLoading(false)
      return { error: result.error }
    }
    setUser({ ...result.user })
    setLoading(false)
    toast.success('Login mock realizado!')
    return { error: null }
  }, [])

  const register = useCallback(
    async (email: string, password: string, data: Partial<User>) => {
      const result = mockStore.register(email, password, data)
      if (result.error || !result.user) {
        return { data: undefined, error: result.error }
      }
      setUser({ ...result.user })
      toast.success('Conta mock criada com sucesso!')
      return {
        data: {
          user: { id: result.user.id, email: result.user.email } as any,
          session: { user: { id: result.user.id } } as any,
        } as AuthResponse['data'],
        error: null,
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    mockStore.logout()
    setUser(null)
    setLoading(false)
    toast.info('Você saiu da conta (mock).')
  }, [])

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!user) return { error: 'No user' }
      const updated = mockStore.updateUser(user.id, data)
      if (!updated) return { error: 'User not found' }
      setUser({ ...updated })
      if (!data.points && !data.notificationPreferences) {
        toast.success('Perfil atualizado!')
      }
      return { error: null }
    },
    [user],
  )

  const deleteUser = useCallback(async (id: string) => {
    mockStore.deleteUser(id)
    toast.success('Usuário excluído com sucesso.')
  }, [])

  const toggleUserStatus = useCallback(async (id: string) => {
    const updated = mockStore.toggleUserStatus(id)
    if (!updated) return
    toast.success(
      `Usuário ${updated.status === 'active' ? 'ativado' : 'desativado'}.`,
    )
  }, [])

  const checkUsernameAvailability = useCallback(async (username: string) => {
    return mockStore.isUsernameAvailable(username)
  }, [])

  const loadAllUsers = useCallback(async () => {
    const users = mockStore.users.map((item) => ({ ...item }))
    setAllUsers(users)
    return users
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      allUsers,
      login,
      register,
      logout,
      updateUser,
      deleteUser,
      toggleUserStatus,
      checkUsernameAvailability,
      loadAllUsers,
      loading,
    }),
    [
      user,
      allUsers,
      login,
      register,
      logout,
      updateUser,
      deleteUser,
      toggleUserStatus,
      checkUsernameAvailability,
      loadAllUsers,
      loading,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
