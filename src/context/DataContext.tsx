import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { toast } from 'sonner'
import { SocialLinks, useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { notificationService } from '@/services/notifications'
import { workoutService } from '@/services/workouts'
import { socialService, FollowRelation } from '@/services/social'

export interface Exercise {
  id: string
  name: string
  sets: string
  reps: string
  instructions: string
  videoUrl?: string
  variations?: { name: string; sets: string; reps: string }[]
}

export interface Workout {
  id: string
  trainerId: string
  trainerName: string
  title: string
  description: string
  image: string
  duration: number
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'
  category: string[]
  exercises: Exercise[]
  status: 'draft' | 'published'
  createdAt: string
  isCircuit?: boolean
  price?: number
  isPaid?: boolean
  purchaseType?: 'subscription' | 'one_time' | 'free'
}

export interface Review {
  id: string
  workoutId: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  createdAt: string
}

export interface ProgressLog {
  id: string
  userId: string
  workoutId: string
  workoutTitle: string
  date: string
  duration: number
  notes: string
}

export interface Notification {
  id: string
  userId: string
  message: string
  read: boolean
  createdAt: string
  link?: string
  type: 'info' | 'success' | 'warning' | 'new_follower' | 'workout_assignment'
}

export interface PublicUser {
  id: string
  username: string
  name: string
  role: 'subscriber' | 'trainer'
  avatar: string
  bio?: string
  socialLinks?: SocialLinks
}

export interface Assignment {
  id: string
  userId: string
  trainerId: string
  workoutId: string
  assignedAt: string
  status: 'pending' | 'completed'
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
}

interface DataContextType {
  workouts: Workout[]
  reviews: Review[]
  progressLogs: ProgressLog[]
  notifications: Notification[]
  publicUsers: PublicUser[]
  following: FollowRelation[]
  assignments: Assignment[]
  messages: Message[]
  addWorkout: (
    workout: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>,
  ) => void
  updateWorkout: (id: string, workout: Partial<Workout>) => void
  deleteWorkout: (id: string) => void
  getWorkoutsByTrainer: (trainerId: string) => Workout[]
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void
  getReviewsByWorkout: (workoutId: string) => Review[]
  addProgressLog: (log: Omit<ProgressLog, 'id'>) => void
  getUserProgress: (userId: string) => ProgressLog[]
  markNotificationAsRead: (id: string) => void
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  ) => void
  followUser: (followerId: string, followingId: string) => void
  unfollowUser: (followerId: string, followingId: string) => void
  acceptFollowRequest: (followerId: string, followingId: string) => void
  rejectFollowRequest: (followerId: string, followingId: string) => void
  isFollowing: (followerId: string, followingId: string) => boolean
  isPending: (followerId: string, followingId: string) => boolean
  assignWorkout: (userId: string, trainerId: string, workoutId: string) => void
  sendMessage: (senderId: string, receiverId: string, content: string) => void
  searchUsers: (query: string) => Promise<PublicUser[]>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([])
  const [following, setFollowing] = useState<FollowRelation[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  const refreshData = useCallback(async () => {
    try {
      // OTIMIZAÇÃO: Limitar quantidade de dados carregados inicialmente
      // Em vez de carregar TODOS os workouts, carregamos apenas os primeiros 50
      // Para mais dados, use os hooks do React Query (useWorkouts)
      const [wData, rData, fData] = await Promise.all([
        workoutService.fetchWorkoutsPaginated({ page: 1, pageSize: 50 }).then(res => res.data),
        workoutService.fetchReviewsPaginated(undefined, { page: 1, pageSize: 100 }).then(res => res.data),
        socialService.fetchFollows(),
      ])
      setWorkouts(wData)
      setReviews(rData)
      setFollowing(fData)

      // OTIMIZAÇÃO: Limitar perfis públicos carregados (apenas primeiros 100)
      // Para busca, use o serviço de busca que já existe
      const { data: uData } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, avatar_url, bio, metadata')
        .limit(100)
        .order('created_at', { ascending: false })
      
      if (uData) {
        setPublicUsers(
          uData.map((p) => ({
            id: p.id,
            username: p.username || '',
            name: p.full_name || p.username,
            role: p.role as 'subscriber' | 'trainer',
            avatar: p.avatar_url,
            bio: p.bio,
            socialLinks: p.metadata?.socialLinks,
          })),
        )
      }
    } catch (error) {
      logger.error('Error fetching data', error)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    if (user) {
      // OTIMIZAÇÃO: Limitar notificações a 30 mais recentes
      notificationService
        .fetchNotificationsPaginated(user.id, { page: 1, pageSize: 30 })
        .then((res) => setNotifications(res.data))
        .catch((err) => logger.error('Error fetching notifications', err))

      // OTIMIZAÇÃO: Limitar progress logs a 50 mais recentes
      supabase
        .from('progress_logs')
        .select('id, user_id, workout_id, workout_title, date, duration, notes')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (error) {
            logger.error('Error fetching progress logs', error)
            return
          }
          if (data) {
            setProgressLogs(
              data.map((l: any) => ({
                id: l.id,
                userId: l.user_id,
                workoutId: l.workout_id,
                workoutTitle: l.workout_title,
                date: l.date,
                duration: l.duration,
                notes: l.notes,
              })),
            )
          }
        })

      // OTIMIZAÇÃO: Limitar messages a 50 mais recentes
      supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at, read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (error) {
            logger.error('Error fetching messages', error)
            return
          }
          if (data) {
            setMessages(
              data.map((m: any) => ({
                id: m.id,
                senderId: m.sender_id,
                receiverId: m.receiver_id,
                content: m.content,
                timestamp: m.created_at,
                read: m.read,
              })),
            )
          }
        })

      // OTIMIZAÇÃO: Limitar assignments a 20 mais recentes
      supabase
        .from('assignments')
        .select('id, user_id, trainer_id, workout_id, assigned_at, status')
        .or(`user_id.eq.${user.id},trainer_id.eq.${user.id}`)
        .order('assigned_at', { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (error) {
            logger.error('Error fetching assignments', error)
            return
          }
          if (data) {
            setAssignments(
              data.map((a: any) => ({
                id: a.id,
                userId: a.user_id,
                trainerId: a.trainer_id,
                workoutId: a.workout_id,
                assignedAt: a.assigned_at,
                status: a.status,
              })),
            )
          }
        })
    }
  }, [user])

  const addWorkout = useCallback(
    async (workoutData: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>) => {
      try {
        await workoutService.createWorkout(workoutData)
        refreshData()
        toast.success('Treino criado com sucesso!')
      } catch (error: any) {
        toast.error('Erro ao criar treino: ' + error.message)
      }
    },
    [refreshData],
  )

  const updateWorkout = useCallback(
    async (id: string, data: Partial<Workout>) => {
      if (!user) {
        toast.error('Você precisa estar logado para atualizar treinos.')
        return
      }

      // Verificar se o workout pertence ao trainer ou se é admin
      const workout = workouts.find((w) => w.id === id)
      if (!workout) {
        toast.error('Treino não encontrado.')
        return
      }

      if (workout.trainerId !== user.id && user.role !== 'admin') {
        toast.error('Você não tem permissão para atualizar este treino.')
        return
      }

      const { error } = await supabase
        .from('workouts')
        .update({
          title: data.title,
          description: data.description,
          duration: data.duration,
          difficulty: data.difficulty,
          status: data.status,
        })
        .eq('id', id)

      if (error) toast.error('Erro ao atualizar')
      else {
        refreshData()
        toast.success('Treino atualizado!')
      }
    },
    [refreshData, user, workouts],
  )

  const deleteWorkout = useCallback(
    async (id: string) => {
      if (!user) {
        toast.error('Você precisa estar logado para excluir treinos.')
        return
      }

      // Verificar se o workout pertence ao trainer ou se é admin
      const workout = workouts.find((w) => w.id === id)
      if (!workout) {
        toast.error('Treino não encontrado.')
        return
      }

      if (workout.trainerId !== user.id && user.role !== 'admin') {
        toast.error('Você não tem permissão para excluir este treino.')
        return
      }

      try {
        await workoutService.deleteWorkout(id)
        refreshData()
        toast.success('Treino excluído.')
      } catch (error) {
        toast.error('Erro ao excluir treino')
      }
    },
    [refreshData, user, workouts],
  )

  const getWorkoutsByTrainer = useCallback(
    (trainerId: string) => {
      return workouts.filter((w) => w.trainerId === trainerId)
    },
    [workouts],
  )

  const addReview = useCallback(
    async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
      try {
        await workoutService.addReview(reviewData)
        refreshData()
        toast.success('Avaliação enviada!')
      } catch (error) {
        toast.error('Erro ao enviar avaliação')
      }
    },
    [refreshData],
  )

  const getReviewsByWorkout = useCallback(
    (workoutId: string) => {
      return reviews.filter((r) => r.workoutId === workoutId)
    },
    [reviews],
  )

  const addProgressLog = useCallback(
    async (logData: Omit<ProgressLog, 'id'>) => {
      const { error } = await supabase.from('progress_logs').insert({
        user_id: logData.userId,
        workout_id: logData.workoutId,
        workout_title: logData.workoutTitle,
        duration: logData.duration,
        notes: logData.notes,
      })

      if (error) toast.error('Erro ao salvar progresso')
      else {
        setProgressLogs((prev) => [
          {
            ...logData,
            id: Math.random().toString(),
            date: new Date().toISOString(),
          },
          ...prev,
        ])
        toast.success('Progresso registrado!')
      }
    },
    [],
  )

  const getUserProgress = useCallback(
    (userId: string) => {
      return progressLogs.filter((log) => log.userId === userId)
    },
    [progressLogs],
  )

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    } catch (error) {
      logger.error('Error in DataContext', error)
    }
  }, [])

  const addNotification = useCallback(
    async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      try {
        await notificationService.create(notification)
        if (user && notification.userId === user.id) {
          setNotifications((prev) => [
            {
              ...notification,
              id: Math.random().toString(),
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...prev,
          ])
        }
      } catch (error) {
        logger.error('Error in DataContext', error)
      }
    },
    [user],
  )

  const followUser = useCallback(
    async (followerId: string, followingId: string) => {
      try {
        await socialService.follow(followerId, followingId)
        setFollowing((prev) => [
          ...prev,
          { followerId, followingId, status: 'pending' },
        ])
        toast.success('Solicitação de seguimento enviada!')

        // Notify target user
        addNotification({
          userId: followingId,
          message: 'Você tem uma nova solicitação de seguidor.',
          type: 'new_follower',
          link: '/social',
        })
      } catch (error) {
        toast.error('Erro ao seguir usuário')
      }
    },
    [addNotification],
  )

  const unfollowUser = useCallback(
    async (followerId: string, followingId: string) => {
      try {
        await socialService.unfollow(followerId, followingId)
        setFollowing((prev) =>
          prev.filter(
            (f) =>
              !(f.followerId === followerId && f.followingId === followingId),
          ),
        )
        toast.info('Você deixou de seguir este usuário.')
      } catch (error) {
        toast.error('Erro ao deixar de seguir')
      }
    },
    [],
  )

  const acceptFollowRequest = useCallback(
    async (followerId: string, followingId: string) => {
      try {
        await socialService.acceptFollow(followerId, followingId)
        setFollowing((prev) =>
          prev.map((f) =>
            f.followerId === followerId && f.followingId === followingId
              ? { ...f, status: 'accepted' }
              : f,
          ),
        )
        toast.success('Solicitação aceita!')
      } catch (error) {
        toast.error('Erro ao aceitar solicitação')
      }
    },
    [],
  )

  const rejectFollowRequest = useCallback(
    async (followerId: string, followingId: string) => {
      try {
        await socialService.rejectFollow(followerId, followingId)
        setFollowing((prev) =>
          prev.filter(
            (f) =>
              !(f.followerId === followerId && f.followingId === followingId),
          ),
        )
        toast.info('Solicitação recusada.')
      } catch (error) {
        toast.error('Erro ao recusar solicitação')
      }
    },
    [],
  )

  const isFollowing = useCallback(
    (followerId: string, followingId: string) => {
      return following.some(
        (f) =>
          f.followerId === followerId &&
          f.followingId === followingId &&
          f.status === 'accepted',
      )
    },
    [following],
  )

  const isPending = useCallback(
    (followerId: string, followingId: string) => {
      return following.some(
        (f) =>
          f.followerId === followerId &&
          f.followingId === followingId &&
          f.status === 'pending',
      )
    },
    [following],
  )

  const assignWorkout = useCallback(
    async (userId: string, trainerId: string, workoutId: string) => {
      if (!user) {
        toast.error('Você precisa estar logado para atribuir treinos.')
        return
      }

      // Apenas trainers e admins podem atribuir treinos
      if (user.role !== 'trainer' && user.role !== 'admin') {
        toast.error('Apenas trainers podem atribuir treinos.')
        return
      }

      // Verificar se o trainerId corresponde ao usuário logado (ou se é admin)
      if (trainerId !== user.id && user.role !== 'admin') {
        toast.error('Você não tem permissão para atribuir treinos como este trainer.')
        return
      }

      // Verificar se o workout pertence ao trainer
      const workout = workouts.find((w) => w.id === workoutId)
      if (!workout) {
        toast.error('Treino não encontrado.')
        return
      }

      if (workout.trainerId !== trainerId && user.role !== 'admin') {
        toast.error('Você só pode atribuir seus próprios treinos.')
        return
      }

      const { error } = await supabase.from('assignments').insert({
        user_id: userId,
        trainer_id: trainerId,
        workout_id: workoutId,
      })

      if (error) {
        toast.error('Erro ao atribuir treino')
        logger.error('Error assigning workout', error)
        throw error // Re-throw para que o componente possa tratar
      } else {
        setAssignments((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            userId,
            trainerId,
            workoutId,
            assignedAt: new Date().toISOString(),
            status: 'pending',
          },
        ])
        toast.success('Treino atribuído com sucesso!')
        addNotification({
          userId,
          message: 'Você recebeu um novo treino do seu treinador.',
          type: 'workout_assignment',
          link: '/dashboard',
        })
      }
    },
    [addNotification, user, workouts],
  )

  const sendMessage = useCallback(
    async (senderId: string, receiverId: string, content: string) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      })

      if (error) toast.error('Erro ao enviar mensagem')
      else {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            senderId,
            receiverId,
            content,
            timestamp: new Date().toISOString(),
            read: false,
          },
        ])
      }
    },
    [],
  )

  const searchUsers = useCallback(async (query: string) => {
    return await socialService.searchUsers(query)
  }, [])

  const value = useMemo(
    () => ({
      workouts,
      reviews,
      progressLogs,
      notifications,
      publicUsers,
      following,
      assignments,
      messages,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      getWorkoutsByTrainer,
      addReview,
      getReviewsByWorkout,
      addProgressLog,
      getUserProgress,
      markNotificationAsRead,
      addNotification,
      followUser,
      unfollowUser,
      acceptFollowRequest,
      rejectFollowRequest,
      isFollowing,
      isPending,
      assignWorkout,
      sendMessage,
      searchUsers,
    }),
    [
      workouts,
      reviews,
      progressLogs,
      notifications,
      publicUsers,
      following,
      assignments,
      messages,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      getWorkoutsByTrainer,
      addReview,
      getReviewsByWorkout,
      addProgressLog,
      getUserProgress,
      markNotificationAsRead,
      addNotification,
      followUser,
      unfollowUser,
      acceptFollowRequest,
      rejectFollowRequest,
      isFollowing,
      isPending,
      assignWorkout,
      sendMessage,
      searchUsers,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined)
    throw new Error('useData must be used within a DataProvider')
  return context
}
