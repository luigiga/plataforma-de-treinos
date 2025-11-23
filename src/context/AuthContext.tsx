import React, { createContext, useContext, useState } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export type UserRole = 'subscriber' | 'trainer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  bio?: string
  preferences?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, role: UserRole) => Promise<boolean>
  register: (data: Partial<User>) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock Database for strict validation
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'João Subscriber',
    email: 'user@fit.com',
    role: 'subscriber',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=1',
    preferences: ['Hipertrofia', 'Força'],
  },
  {
    id: '2',
    name: 'Maria Trainer',
    email: 'trainer@fit.com',
    role: 'trainer',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=2',
    bio: 'Especialista em Yoga e Funcional',
  },
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('pt_platform_user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const login = async (email: string, role: UserRole): Promise<boolean> => {
    logger.info(`Login attempt for ${email} with role ${role}`)

    const existingUser = MOCK_USERS.find((u) => u.email === email)

    if (existingUser) {
      if (existingUser.role !== role) {
        const errorMsg = `Erro de Login: Esta conta está registrada como ${existingUser.role === 'trainer' ? 'Personal Trainer' : 'Assinante'}. Por favor, ajuste sua seleção.`
        logger.warn(`Login failed: Role mismatch for ${email}`)
        toast.error(errorMsg)
        return false
      }

      setUser(existingUser)
      localStorage.setItem('pt_platform_user', JSON.stringify(existingUser))
      toast.success(`Bem-vindo de volta, ${existingUser.name}!`)
      logger.info(`Login successful for ${email}`)
      return true
    }

    // For demo purposes, allow new users to "login" (simulate registration on the fly if not in mock DB)
    // In a real app, this would fail or redirect to register
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      role,
      avatar: `https://img.usecurling.com/ppl/medium?gender=male&seed=${Math.random()}`,
      preferences: role === 'subscriber' ? ['Geral'] : undefined,
    }

    setUser(newUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(newUser))
    toast.success(`Bem-vindo, ${newUser.name}!`)
    logger.info(`New user login (demo) for ${email}`)
    return true
  }

  const register = (data: Partial<User>) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || 'Novo Usuário',
      email: data.email || 'user@example.com',
      role: data.role || 'subscriber',
      avatar: `https://img.usecurling.com/ppl/medium?gender=${Math.random() > 0.5 ? 'male' : 'female'}`,
      bio: data.bio,
      preferences: data.role === 'subscriber' ? ['Geral'] : undefined,
    }
    setUser(newUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(newUser))
    logger.info(`User registered: ${newUser.email}`)
    toast.success('Conta criada com sucesso!')
  }

  const logout = () => {
    logger.info(`User logged out: ${user?.email}`)
    setUser(null)
    localStorage.removeItem('pt_platform_user')
    toast.info('Você saiu da conta.')
  }

  const updateUser = (data: Partial<User>) => {
    if (!user) return
    const updatedUser = { ...user, ...data }
    setUser(updatedUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(updatedUser))
    logger.info(`User updated profile: ${user.id}`)
    toast.success('Perfil atualizado!')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
