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
import { notificationService } from '@/services/notifications'
import { workoutService } from '@/services/workouts'
import { socialService } from '@/services/social'

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
  type: 'info' | 'success' | 'warning'
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
  following: { followerId: string; followingId: string }[]
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
  isFollowing: (followerId: string, followingId: string) => boolean
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
  const [following, setFollowing] = useState<
    { followerId: string; followingId: string }[]
  >([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  const refreshData = useCallback(async () => {
    try {
      const [wData, rData, fData] = await Promise.all([
        workoutService.fetchWorkouts(),
        workoutService.fetchReviews(),
        socialService.fetchFollows(),
      ])
      setWorkouts(wData)
      setReviews(rData)
      setFollowing(fData)

      // Fetch public users
      const { data: uData } = await supabase.from('profiles').select('*')
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
      console.error('Error fetching data:', error)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    if (user) {
      notificationService.fetchNotifications(user.id).then(setNotifications)

      // Fetch user specific data
      supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => {
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

      supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .then(({ data }) => {
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

      supabase
        .from('assignments')
        .select('*')
        .or(`user_id.eq.${user.id},trainer_id.eq.${user.id}`)
        .then(({ data }) => {
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
      // Simplified update for now
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
    [refreshData],
  )

  const deleteWorkout = useCallback(
    async (id: string) => {
      try {
        await workoutService.deleteWorkout(id)
        refreshData()
        toast.success('Treino excluído.')
      } catch (error) {
        toast.error('Erro ao excluir treino')
      }
    },
    [refreshData],
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
        // Optimistic update
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
      console.error(error)
    }
  }, [])

  const addNotification = useCallback(
    async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      try {
        await notificationService.create(notification)
        // Realtime subscription would handle this, but for now:
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
        console.error(error)
      }
    },
    [user],
  )

  const followUser = useCallback(
    async (followerId: string, followingId: string) => {
      try {
        await socialService.follow(followerId, followingId)
        setFollowing((prev) => [...prev, { followerId, followingId }])
        toast.success('Você começou a seguir este usuário!')
      } catch (error) {
        toast.error('Erro ao seguir usuário')
      }
    },
    [],
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

  const isFollowing = useCallback(
    (followerId: string, followingId: string) => {
      return following.some(
        (f) => f.followerId === followerId && f.followingId === followingId,
      )
    },
    [following],
  )

  const assignWorkout = useCallback(
    async (userId: string, trainerId: string, workoutId: string) => {
      const { error } = await supabase.from('assignments').insert({
        user_id: userId,
        trainer_id: trainerId,
        workout_id: workoutId,
      })

      if (error) toast.error('Erro ao atribuir treino')
      else {
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
      }
    },
    [],
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
      isFollowing,
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
      isFollowing,
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
