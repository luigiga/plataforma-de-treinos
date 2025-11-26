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
import { Session, AuthResponse } from '@supabase/supabase-js'
import { profileService } from '@/services/profile'

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

export interface NotificationPreferences {
  newFollower: boolean
  newMessage: boolean
  workoutAssignment: boolean
  systemUpdates: boolean
}

export interface User {
  id: string
  username: string
  full_name: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  bio?: string
  socialLinks?: SocialLinks
  preferences?: string[]
  notificationPreferences?: NotificationPreferences
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
  login: (email: string, password: string) => Promise<{ error: any }>
  register: (
    email: string,
    password: string,
    data: Partial<User>,
  ) => Promise<{ data?: AuthResponse['data']; error: any }>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<{ error: any }>
  deleteUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>
  checkUsernameAvailability: (username: string) => Promise<boolean>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const defaultNotificationPreferences: NotificationPreferences = {
  newFollower: true,
  newMessage: true,
  workoutAssignment: true,
  systemUpdates: true,
}

const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  username: profile.username || '',
  full_name: profile.full_name || '',
  name: profile.full_name || profile.username || 'User',
  email: profile.email || '',
  role: (profile.role as UserRole) || 'subscriber',
  avatar: profile.avatar_url,
  bio: profile.bio,
  socialLinks: profile.metadata?.socialLinks,
  preferences: profile.metadata?.preferences,
  notificationPreferences:
    profile.metadata?.notificationPreferences || defaultNotificationPreferences,
  subscriptionStatus: profile.metadata?.subscriptionStatus || 'inactive',
  plan: profile.metadata?.plan || 'free',
  status: profile.status || profile.metadata?.status || 'active',
  points: profile.metadata?.points || 0,
  badges: profile.metadata?.badges || [],
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ) {
      const errorMsg =
        'Missing Supabase environment variables. Please check your .env file.'
      logger.error(errorMsg)
      toast.error('Configuration Error: ' + errorMsg)
    }
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    const profile = await profileService.getProfile(userId)
    if (!profile) return null
    return mapProfileToUser(profile)
  }, [])

  const fetchAllUsers = useCallback(async () => {
    const profiles = await profileService.getAllProfiles()
    setAllUsers(profiles.map(mapProfileToUser))
  }, [])

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
  }, [fetchProfile, fetchAllUsers])

  const login = useCallback(
    async (email: string, password: string): Promise<{ error: any }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          logger.error('Login failed', error)
          let message = error.message
          if (error.message === 'Invalid login credentials') {
            message = 'E-mail ou senha inválidos. Por favor, tente novamente.'
          }
          return { error: { message } }
        }
        toast.success('Login realizado com sucesso!')
        return { error: null }
      } catch (err: any) {
        logger.error('Unexpected error during login', err)
        return {
          error: { message: 'Ocorreu um erro inesperado. Tente novamente.' },
        }
      }
    },
    [],
  )

  const register = useCallback(
    async (email: string, password: string, data: Partial<User>) => {
      try {
        logger.info('Starting user registration', {
          email,
          username: data.username,
        })

        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: data.username,
              full_name: data.name,
              role: data.role,
              avatar_url: data.avatar,
              bio: data.bio,
            },
          },
        })

        if (error) {
          logger.error('Registration failed', error)
          let message =
            'Ocorreu um erro inesperado durante o registro. Por favor, tente novamente.'

          if (
            error.message?.includes('User already registered') ||
            error.message?.includes('already registered')
          ) {
            message = 'Email already registered'
          }

          return { data: authData, error: { message } }
        } else {
          logger.info('User registered successfully', {
            userId: authData.user?.id,
          })

          if (authData.session) {
            toast.success('Conta criada com sucesso!')

            supabase.functions
              .invoke('send-welcome-email', {
                body: {
                  email: email,
                  name: data.name || data.username || 'User',
                  username: data.username || 'user',
                },
              })
              .then(({ error }) => {
                if (error) {
                  logger.error('Failed to send welcome email', error)
                } else {
                  logger.info('Welcome email trigger sent successfully')
                }
              })
          } else {
            toast.success('Conta criada! Verifique seu email para confirmar.')
            logger.info(
              'Registration successful, waiting for email verification',
            )
          }
          return { data: authData, error: null }
        }
      } catch (err) {
        logger.error('Unexpected error during registration', err)
        return {
          error: {
            message:
              'Ocorreu um erro inesperado durante o registro. Por favor, tente novamente.',
          },
        }
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast.info('Você saiu da conta.')
    } catch (err) {
      logger.error('Error during logout', err)
    }
  }, [])

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!user) return { error: 'No user' }

      const updates: any = {}
      if (data.full_name !== undefined) updates.full_name = data.full_name
      if (data.username !== undefined) updates.username = data.username
      if (data.bio !== undefined) updates.bio = data.bio
      if (data.avatar !== undefined) updates.avatar_url = data.avatar
      if (data.status !== undefined) updates.status = data.status

      const metadataUpdates: any = {}
      if (data.socialLinks) metadataUpdates.socialLinks = data.socialLinks
      if (data.preferences) metadataUpdates.preferences = data.preferences
      if (data.notificationPreferences)
        metadataUpdates.notificationPreferences = data.notificationPreferences
      if (data.subscriptionStatus)
        metadataUpdates.subscriptionStatus = data.subscriptionStatus
      if (data.plan) metadataUpdates.plan = data.plan
      if (data.points !== undefined) metadataUpdates.points = data.points
      if (data.badges) metadataUpdates.badges = data.badges

      if (Object.keys(metadataUpdates).length > 0) {
        updates.metadata = {
          socialLinks: data.socialLinks || user.socialLinks,
          preferences: data.preferences || user.preferences,
          notificationPreferences:
            data.notificationPreferences || user.notificationPreferences,
          subscriptionStatus:
            data.subscriptionStatus || user.subscriptionStatus,
          plan: data.plan || user.plan,
          status: data.status || user.status,
          points: data.points !== undefined ? data.points : user.points,
          badges: data.badges || user.badges,
        }
      }

      try {
        await profileService.updateProfile(user.id, updates)

        const updatedUser = { ...user, ...data }
        if (data.full_name || data.username) {
          updatedUser.name = data.full_name || data.username || updatedUser.name
        }

        setUser(updatedUser)
        setAllUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u)),
        )
        if (!data.points && !data.notificationPreferences)
          toast.success('Perfil atualizado!')
        return { error: null }
      } catch (error: any) {
        toast.error('Erro ao atualizar perfil: ' + error.message)
        return { error }
      }
    },
    [user],
  )

  const deleteUser = useCallback(async (id: string) => {
    try {
      await profileService.deleteProfile(id)
      setAllUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success('Usuário excluído com sucesso.')
    } catch (error) {
      toast.error('Erro ao excluir usuário')
    }
  }, [])

  const toggleUserStatus = useCallback(
    async (id: string) => {
      const targetUser = allUsers.find((u) => u.id === id)
      if (!targetUser) return

      const newStatus = targetUser.status === 'active' ? 'inactive' : 'active'
      try {
        await profileService.updateProfile(id, {
          status: newStatus,
          metadata: { ...targetUser, status: newStatus },
        })

        setAllUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
        )
        toast.success(
          `Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}.`,
        )
      } catch (error) {
        toast.error('Erro ao atualizar status')
      }
    },
    [allUsers],
  )

  const checkUsernameAvailability = useCallback(async (username: string) => {
    return await profileService.checkUsernameAvailability(username)
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
