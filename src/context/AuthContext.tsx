import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { toast } from 'sonner'

export type UserRole = 'subscriber' | 'trainer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, role: UserRole) => void
  register: (data: Partial<User>) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const STORAGE_KEY = 'pt_platform_user'

function isUserRole(value: unknown): value is UserRole {
  return value === 'subscriber' || value === 'trainer'
}

function isStoredUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false

  const user = value as Partial<User>

  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    isUserRole(user.role)
  )
}

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null

  const storedUser = window.localStorage.getItem(STORAGE_KEY)
  if (!storedUser) return null

  try {
    const parsedUser = JSON.parse(storedUser)

    if (!isStoredUser(parsedUser)) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsedUser
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function createUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 11)
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const loading = false

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login = useCallback((email: string, role: UserRole) => {
    const normalizedEmail = email.trim().toLowerCase()
    const displayName = normalizedEmail.split('@')[0] || 'Usuário'

    const nextUser: User = {
      id: createUserId(),
      name: displayName,
      email: normalizedEmail,
      role,
      avatar: `https://img.usecurling.com/ppl/medium?gender=male&seed=${encodeURIComponent(normalizedEmail)}`,
      bio:
        role === 'trainer'
          ? 'Personal Trainer certificado com 5 anos de experiência em hipertrofia e funcional.'
          : undefined,
    }

    setUser(nextUser)
    toast.success(`Bem-vindo de volta, ${nextUser.name}!`)
  }, [])

  const register = useCallback((data: Partial<User>) => {
    const normalizedEmail = (data.email || 'user@example.com').trim().toLowerCase()
    const role = isUserRole(data.role) ? data.role : 'subscriber'

    const nextUser: User = {
      id: createUserId(),
      name: data.name?.trim() || 'Novo Usuário',
      email: normalizedEmail,
      role,
      avatar: `https://img.usecurling.com/ppl/medium?gender=${Math.random() > 0.5 ? 'male' : 'female'}`,
      bio: data.bio,
    }

    setUser(nextUser)
    toast.success('Conta criada com sucesso!')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    toast.info('Você saiu da conta.')
  }, [])

  const updateUser = useCallback(
    (data: Partial<User>) => {
      if (!user) return

      const updatedUser: User = {
        ...user,
        ...data,
        email: data.email ? data.email.trim().toLowerCase() : user.email,
        role: isUserRole(data.role) ? data.role : user.role,
      }

      setUser(updatedUser)
      toast.success('Perfil atualizado!')
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      loading,
    }),
    [user, login, register, logout, updateUser, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
