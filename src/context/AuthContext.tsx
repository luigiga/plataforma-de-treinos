import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export type UserRole = 'subscriber' | 'trainer' | 'admin'
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled'
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'vip'
export type UserStatus = 'active' | 'inactive'

export interface SocialLinks {
  instagram?: string
  twitter?: string
  linkedin?: string
  website?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  bio?: string
  socialLinks?: SocialLinks
  preferences?: string[]
  subscriptionStatus?: SubscriptionStatus
  plan?: SubscriptionPlan
  status?: UserStatus
  points?: number
  badges?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  allUsers: User[]
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  register: (data: Partial<User>) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleUserStatus: (id: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_USERS: User[] = [
  {
    id: '0',
    name: 'Administrador',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=admin',
    status: 'active',
    plan: 'vip',
    bio: 'Gerente da Plataforma',
    points: 0,
    badges: [],
  },
  {
    id: '1',
    name: 'João Subscriber',
    email: 'user@fit.com',
    role: 'subscriber',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=1',
    preferences: ['Hipertrofia', 'Força'],
    subscriptionStatus: 'active',
    plan: 'premium',
    status: 'active',
    bio: 'Focado em superar limites.',
    socialLinks: { instagram: '@joao.fit' },
    points: 350,
    badges: ['beginner', 'focused'],
  },
  {
    id: '2',
    name: 'Maria Trainer',
    email: 'trainer@fit.com',
    role: 'trainer',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=2',
    bio: 'Especialista em Yoga e Funcional. Transformando vidas através do movimento.',
    subscriptionStatus: 'active',
    plan: 'vip',
    status: 'active',
    socialLinks: { instagram: '@maria.yoga', website: 'www.mariayoga.com' },
    points: 0,
    badges: [],
  },
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem('pt_platform_users_db')
    return storedUsers ? JSON.parse(storedUsers) : MOCK_USERS
  })

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('pt_platform_user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  useEffect(() => {
    localStorage.setItem('pt_platform_users_db', JSON.stringify(allUsers))
  }, [allUsers])

  const login = useCallback(
    async (
      email: string,
      password: string,
      role: UserRole,
    ): Promise<boolean> => {
      logger.info(`Login attempt for ${email}`)
      if (email === 'admin@example.com') {
        if (password !== 'admin123') {
          toast.error('Credenciais inválidas.')
          return false
        }
        let adminUser = allUsers.find((u) => u.email === 'admin@example.com')
        if (!adminUser) {
          adminUser = MOCK_USERS[0]
          setAllUsers((prev) => [...prev, adminUser!])
        }
        setUser(adminUser)
        localStorage.setItem('pt_platform_user', JSON.stringify(adminUser))
        toast.success(`Bem-vindo de volta, ${adminUser.name}!`)
        return true
      }

      const existingUser = allUsers.find((u) => u.email === email)
      if (existingUser) {
        if (existingUser.status === 'inactive') {
          toast.error('Conta desativada. Entre em contato com o suporte.')
          return false
        }
        setUser(existingUser)
        localStorage.setItem('pt_platform_user', JSON.stringify(existingUser))
        toast.success(`Bem-vindo de volta, ${existingUser.name}!`)
        return true
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email,
        role,
        avatar: `https://img.usecurling.com/ppl/medium?gender=male&seed=${Math.random()}`,
        preferences: role === 'subscriber' ? ['Geral'] : undefined,
        subscriptionStatus: 'inactive',
        plan: 'free',
        status: 'active',
        points: 0,
        badges: ['beginner'],
      }
      setAllUsers((prev) => [...prev, newUser])
      setUser(newUser)
      localStorage.setItem('pt_platform_user', JSON.stringify(newUser))
      toast.success(`Bem-vindo, ${newUser.name}!`)
      return true
    },
    [allUsers],
  )

  const register = useCallback((data: Partial<User>) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || 'Novo Usuário',
      email: data.email || 'user@example.com',
      role: data.role || 'subscriber',
      avatar: `https://img.usecurling.com/ppl/medium?gender=${Math.random() > 0.5 ? 'male' : 'female'}`,
      bio: data.bio,
      preferences: data.role === 'subscriber' ? ['Geral'] : undefined,
      subscriptionStatus: 'inactive',
      plan: 'free',
      status: 'active',
      points: 0,
      badges: ['beginner'],
    }
    setAllUsers((prev) => [...prev, newUser])
    setUser(newUser)
    localStorage.setItem('pt_platform_user', JSON.stringify(newUser))
    toast.success('Conta criada com sucesso!')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('pt_platform_user')
    toast.info('Você saiu da conta.')
  }, [])

  const updateUser = useCallback(
    (data: Partial<User>) => {
      if (!user) return
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      setAllUsers((prev) =>
        prev.map((u) => (u.id === user.id ? updatedUser : u)),
      )
      localStorage.setItem('pt_platform_user', JSON.stringify(updatedUser))
      // Only show toast if not just updating points silently
      if (!data.points) {
        toast.success('Perfil atualizado!')
      }
    },
    [user],
  )

  const deleteUser = useCallback((id: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success('Usuário excluído com sucesso.')
  }, [])

  const toggleUserStatus = useCallback((id: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'active' ? 'inactive' : 'active'
          toast.success(
            `Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}.`,
          )
          return { ...u, status: newStatus }
        }
        return u
      }),
    )
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
    ],
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
