import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AuthResponse, User as SupabaseAuthUser } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'
import { profileService, Profile, ProfileUpdate } from '@/services/profile'

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

interface ProfileMetadata {
  socialLinks?: SocialLinks
  preferences?: string[]
  notificationPreferences?: NotificationPreferences
  subscriptionStatus?: SubscriptionStatus
  plan?: SubscriptionPlan
  status?: UserStatus
  points?: number
  badges?: string[]
  [key: string]: unknown
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
  loadAllUsers: () => Promise<User[]>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const defaultNotificationPreferences: NotificationPreferences = {
  newFollower: true,
  newMessage: true,
  workoutAssignment: true,
  systemUpdates: true,
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'subscriber' || value === 'trainer' || value === 'admin'
}

function normalizeProfileMetadata(value: unknown): ProfileMetadata {
  if (!isRecord(value)) {
    return {}
  }

  return value as ProfileMetadata
}

function getAuthMetadata(user: SupabaseAuthUser): Record<string, unknown> {
  return isRecord(user.user_metadata) ? user.user_metadata : {}
}

function mapProfileToUser(profile: Profile): User {
  const metadata = normalizeProfileMetadata(profile.metadata)
  const profileRole = isUserRole(profile.role) ? profile.role : 'subscriber'

  return {
    id: profile.id,
    username: profile.username || '',
    full_name: profile.full_name || '',
    name: profile.full_name || profile.username || 'User',
    email: profile.email || '',
    role: profileRole,
    avatar: profile.avatar_url || undefined,
    bio: profile.bio || undefined,
    socialLinks: metadata.socialLinks,
    preferences: metadata.preferences,
    notificationPreferences:
      metadata.notificationPreferences || defaultNotificationPreferences,
    subscriptionStatus: metadata.subscriptionStatus || 'inactive',
    plan: metadata.plan || 'free',
    status:
      (profile.status as UserStatus | null) ||
      metadata.status ||
      'active',
    points: metadata.points || 0,
    badges: metadata.badges || [],
  }
}

function buildProfileInsertPayload(
  authUser: SupabaseAuthUser,
  data?: Partial<User>,
) {
  const authMetadata = getAuthMetadata(authUser)
  const usernameFromEmail = authUser.email?.split('@')[0] || 'user'
  const role = isUserRole(data?.role)
    ? data.role
    : isUserRole(authMetadata.role)
      ? authMetadata.role
      : 'subscriber'

  const metadata: ProfileMetadata = {}

  if (data?.socialLinks) metadata.socialLinks = data.socialLinks
  if (data?.preferences) metadata.preferences = data.preferences
  if (data?.notificationPreferences) {
    metadata.notificationPreferences = data.notificationPreferences
  }
  if (data?.subscriptionStatus) metadata.subscriptionStatus = data.subscriptionStatus
  if (data?.plan) metadata.plan = data.plan
  if (data?.status) metadata.status = data.status
  if (data?.points !== undefined) metadata.points = data.points
  if (data?.badges) metadata.badges = data.badges

  return {
    id: authUser.id,
    username:
      data?.username ||
      (typeof authMetadata.username === 'string' ? authMetadata.username : '') ||
      usernameFromEmail,
    full_name:
      data?.full_name ||
      data?.name ||
      (typeof authMetadata.full_name === 'string' ? authMetadata.full_name : '') ||
      (typeof authMetadata.name === 'string' ? authMetadata.name : '') ||
      '',
    avatar_url:
      data?.avatar ||
      (typeof authMetadata.avatar_url === 'string' ? authMetadata.avatar_url : '') ||
      '',
    email: authUser.email || data?.email || '',
    role,
    bio:
      data?.bio ||
      (typeof authMetadata.bio === 'string' ? authMetadata.bio : '') ||
      '',
    metadata,
    status:
      data?.status ||
      (typeof authMetadata.status === 'string' ? authMetadata.status : '') ||
      'active',
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

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
    try {
      const profile = await profileService.getProfile(userId)

      if (!profile) {
        logger.warn('Profile not found for user', userId)
        return null
      }

      return mapProfileToUser(profile)
    } catch (error) {
      logger.error('Error in fetchProfile', error)
      return null
    }
  }, [])

  const createProfileIfMissing = useCallback(
    async (authUser: SupabaseAuthUser, data?: Partial<User>) => {
      try {
        const existingProfile = await profileService.getProfile(authUser.id)
        if (existingProfile) {
          return true
        }

        const payload = buildProfileInsertPayload(authUser, data)
        const { error } = await supabase.from('profiles').insert(payload)

        if (error) {
          logger.error('Failed to create profile manually', {
            error,
            userId: authUser.id,
          })
          return false
        }

        return true
      } catch (error) {
        logger.error('Unexpected error creating profile manually', error)
        return false
      }
    },
    [],
  )

  const loadUserFromAuthUser = useCallback(
    async (authUser: SupabaseAuthUser, data?: Partial<User>) => {
      let profile = await fetchProfile(authUser.id)
      if (profile) {
        return profile
      }

      await createProfileIfMissing(authUser, data)

      profile = await fetchProfile(authUser.id)
      if (profile) {
        return profile
      }

      await sleep(500)
      profile = await fetchProfile(authUser.id)

      if (!profile) {
        logger.error('Profile still unavailable after recovery attempts', {
          userId: authUser.id,
        })
      }

      return profile
    },
    [createProfileIfMissing, fetchProfile],
  )

  const loadAllUsers = useCallback(async () => {
    try {
      const profiles = await profileService.getAllProfiles()
      const mappedUsers = profiles.map(mapProfileToUser)
      setAllUsers(mappedUsers)
      return mappedUsers
    } catch (error) {
      logger.error('Error loading all users', error)
      return []
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      setLoading(true)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!session?.user) {
          setUser(null)
          return
        }

        const currentUser = await loadUserFromAuthUser(session.user)

        if (!isMounted) return
        setUser(currentUser)
      } catch (error) {
        logger.error('Error bootstrapping auth session', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const handleAuthSessionChange = async (authUser: SupabaseAuthUser | null) => {
      if (!isMounted) return

      setLoading(true)

      try {
        if (!authUser) {
          setUser(null)
          return
        }

        const currentUser = await loadUserFromAuthUser(authUser)

        if (!isMounted) return
        setUser(currentUser)
      } catch (error) {
        logger.error('Error handling auth state change', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleAuthSessionChange(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadUserFromAuthUser])

  const login = useCallback(
    async (email: string, password: string): Promise<{ error: any }> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          logger.error('Login failed', error)
          let message = error.message

          if (error.message === 'Invalid login credentials') {
            message = 'Email ou senha inválidos. Por favor, tente novamente.'
          }

          return { error: { message } }
        }

        if (data.session?.user) {
          setLoading(true)
          const profile = await loadUserFromAuthUser(data.session.user)
          setUser(profile)
          setLoading(false)
        }

        toast.success('Login realizado com sucesso!')
        return { error: null }
      } catch (err: any) {
        logger.error('Unexpected error during login', err)
        setLoading(false)
        return {
          error: { message: 'Ocorreu um erro inesperado. Tente novamente.' },
        }
      }
    },
    [loadUserFromAuthUser],
  )

  const register = useCallback(
    async (email: string, password: string, data: Partial<User>) => {
      try {
        logger.info('Starting user registration', {
          email,
          username: data.username,
          role: data.role,
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
              status: 'active',
            },
          },
        })

        if (error) {
          logger.error('Registration failed', { error, email })
          let message =
            'Falha no registro. Por favor, revise seus detalhes e tente novamente.'

          if (
            error.message?.includes('User already registered') ||
            error.message?.includes('already registered') ||
            error.status === 422
          ) {
            message =
              'Este e-mail já está registrado. Por favor, use um e-mail diferente ou faça login.'
          } else if (
            error.message?.includes('duplicate key') ||
            error.message?.includes('username')
          ) {
            message =
              'Este nome de usuário já está em uso. Por favor, escolha um nome de usuário diferente.'
          } else if (
            error.message?.includes('Database error saving new user') ||
            error.status === 500
          ) {
            message =
              'Erro ao criar perfil. Por favor, tente novamente. Se o erro persistir, contate o suporte.'
          }

          return { data: authData, error: { message } }
        }

        logger.info('User registered successfully', {
          userId: authData.user?.id,
        })

        if (authData.session && authData.user) {
          toast.success('Conta criada com sucesso!')
          setLoading(true)
          const profile = await loadUserFromAuthUser(authData.user, data)
          setUser(profile)
          setLoading(false)

          supabase.functions
            .invoke('send-welcome-email', {
              body: {
                email,
                name: data.name || data.username || 'User',
                username: data.username || 'user',
              },
            })
            .then(({ error: emailError }) => {
              if (emailError) {
                logger.error('Failed to send welcome email', emailError)
              } else {
                logger.info('Welcome email trigger sent successfully')
              }
            })
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.')
          logger.info('Registration successful, waiting for email verification')
        }

        return { data: authData, error: null }
      } catch (err) {
        logger.error('Unexpected error during registration', err)
        setLoading(false)
        return {
          error: {
            message:
              'Falha no registro. Por favor, revise seus detalhes e tente novamente.',
          },
        }
      }
    },
    [loadUserFromAuthUser],
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

      const currentProfile = await profileService.getProfile(user.id)
      const currentMetadata = normalizeProfileMetadata(currentProfile?.metadata)
      const nextMetadata: ProfileMetadata = { ...currentMetadata }

      if (data.socialLinks !== undefined) nextMetadata.socialLinks = data.socialLinks
      if (data.preferences !== undefined) nextMetadata.preferences = data.preferences
      if (data.notificationPreferences !== undefined) {
        nextMetadata.notificationPreferences = data.notificationPreferences
      }
      if (data.subscriptionStatus !== undefined) {
        nextMetadata.subscriptionStatus = data.subscriptionStatus
      }
      if (data.plan !== undefined) nextMetadata.plan = data.plan
      if (data.status !== undefined) nextMetadata.status = data.status
      if (data.points !== undefined) nextMetadata.points = data.points
      if (data.badges !== undefined) nextMetadata.badges = data.badges

      const updates: ProfileUpdate = {}
      if (data.full_name !== undefined) updates.full_name = data.full_name
      if (data.username !== undefined) updates.username = data.username
      if (data.bio !== undefined) updates.bio = data.bio
      if (data.avatar !== undefined) updates.avatar_url = data.avatar
      if (data.status !== undefined) updates.status = data.status
      if (Object.keys(nextMetadata).length > 0) updates.metadata = nextMetadata

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

        if (!data.points && !data.notificationPreferences) {
          toast.success('Perfil atualizado!')
        }

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
          metadata: {
            status: newStatus,
          },
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
