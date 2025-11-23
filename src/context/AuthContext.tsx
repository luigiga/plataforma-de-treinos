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
import { supabase } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

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
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  const mapProfileToUser = (profile: any): User => ({
    id: profile.id,
    name: profile.full_name || profile.username || 'User',
    email: profile.email || '',
    role: (profile.role as UserRole) || 'subscriber',
    avatar: profile.avatar_url,
    bio: profile.bio,
    socialLinks: profile.metadata?.socialLinks,
    preferences: profile.metadata?.preferences,
    subscriptionStatus: profile.metadata?.subscriptionStatus || 'inactive',
    plan: profile.metadata?.plan || 'free',
    status: profile.metadata?.status || 'active',
    points: profile.metadata?.points || 0,
    badges: profile.metadata?.badges || [],
  })

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      logger.error('Error fetching profile', error)
      return null
    }
    return mapProfileToUser(data)
  }

  const fetchAllUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) {
      logger.error('Error fetching all users', error)
      return
    }
    setAllUsers(data.map(mapProfileToUser))
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then(setUser)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then((u) => {
          setUser(u)
          setLoading(false)
        })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    fetchAllUsers()

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(
    async (
      email: string,
      password: string,
      _role: UserRole,
    ): Promise<boolean> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        toast.error(error.message)
        return false
      }
      toast.success('Login realizado com sucesso!')
      return true
    },
    [],
  )

  const register = useCallback(async (data: Partial<User>) => {
    const { error } = await supabase.auth.signUp({
      email: data.email!,
      password: 'password123', // In a real app, password should come from form
      options: {
        data: {
          full_name: data.name,
          role: data.role,
          avatar_url: data.avatar,
          bio: data.bio,
        },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Conta criada! Verifique seu email.')
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.info('Você saiu da conta.')
  }, [])

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.name,
          bio: data.bio,
          avatar_url: data.avatar,
          metadata: {
            socialLinks: data.socialLinks || user.socialLinks,
            preferences: data.preferences || user.preferences,
            subscriptionStatus:
              data.subscriptionStatus || user.subscriptionStatus,
            plan: data.plan || user.plan,
            status: data.status || user.status,
            points: data.points !== undefined ? data.points : user.points,
            badges: data.badges || user.badges,
          },
        })
        .eq('id', user.id)

      if (error) {
        toast.error('Erro ao atualizar perfil')
      } else {
        const updatedUser = { ...user, ...data }
        setUser(updatedUser)
        setAllUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u)),
        )
        if (!data.points) toast.success('Perfil atualizado!')
      }
    },
    [user],
  )

  const deleteUser = useCallback(async (id: string) => {
    // Client-side deletion of auth user is not allowed usually.
    // We can delete the profile, but auth user remains.
    // For this demo, we'll just delete the profile.
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir usuário')
    } else {
      setAllUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success('Usuário excluído com sucesso.')
    }
  }, [])

  const toggleUserStatus = useCallback(
    async (id: string) => {
      const targetUser = allUsers.find((u) => u.id === id)
      if (!targetUser) return

      const newStatus = targetUser.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('profiles')
        .update({
          metadata: { ...targetUser, status: newStatus }, // Simplified metadata update
        })
        .eq('id', id)

      if (error) {
        toast.error('Erro ao atualizar status')
      } else {
        setAllUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
        )
        toast.success(
          `Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}.`,
        )
      }
    },
    [allUsers],
  )

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
      loading,
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
