import React, { createContext, useContext, useState, useEffect } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('pt_platform_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = (email: string, role: UserRole) => {
    // Mock login
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0] || 'Usuário',
      email,
      role,
      avatar: `https://img.usecurling.com/ppl/medium?gender=male&seed=${Math.random()}`,
      bio:
        role === 'trainer'
          ? 'Personal Trainer certificado com 5 anos de experiência em hipertrofia e funcional.'
          : undefined,
    }
    setUser(mockUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(mockUser))
    toast.success(`Bem-vindo de volta, ${mockUser.name}!`)
  }

  const register = (data: Partial<User>) => {
    // Mock register
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || 'Novo Usuário',
      email: data.email || 'user@example.com',
      role: data.role || 'subscriber',
      avatar: `https://img.usecurling.com/ppl/medium?gender=${Math.random() > 0.5 ? 'male' : 'female'}`,
      bio: data.bio,
    }
    setUser(newUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(newUser))
    toast.success('Conta criada com sucesso!')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pt_platform_user')
    toast.info('Você saiu da conta.')
  }

  const updateUser = (data: Partial<User>) => {
    if (!user) return
    const updatedUser = { ...user, ...data }
    setUser(updatedUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(updatedUser))
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
