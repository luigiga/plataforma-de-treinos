import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

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
  name: string
  role: 'subscriber' | 'trainer'
  avatar: string
  bio?: string
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
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const INITIAL_WORKOUTS: Workout[] = [
  {
    id: '1',
    trainerId: '101',
    trainerName: 'Carlos Silva',
    title: 'Hipertrofia Total',
    description:
      'Um treino focado em ganho de massa muscular para o corpo todo.',
    image: 'https://img.usecurling.com/p/800/600?q=gym%20workout',
    duration: 60,
    difficulty: 'Avançado',
    category: ['Força', 'Hipertrofia'],
    status: 'published',
    createdAt: new Date().toISOString(),
    isCircuit: false,
    exercises: [
      {
        id: 'e1',
        name: 'Supino Reto',
        sets: '4',
        reps: '10',
        instructions: 'Mantenha os cotovelos a 45 graus.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        variations: [{ name: 'Supino Inclinado', sets: '3', reps: '12' }],
      },
      {
        id: 'e2',
        name: 'Agachamento Livre',
        sets: '4',
        reps: '12',
        instructions: 'Desça até quebrar a paralela.',
      },
    ],
  },
  {
    id: '2',
    trainerId: '102',
    trainerName: 'Ana Souza',
    title: 'Yoga Matinal',
    description: 'Comece o dia com energia e flexibilidade.',
    image: 'https://img.usecurling.com/p/800/600?q=yoga%20pose',
    duration: 30,
    difficulty: 'Iniciante',
    category: ['Yoga', 'Flexibilidade'],
    status: 'published',
    createdAt: new Date().toISOString(),
    isCircuit: false,
    exercises: [
      {
        id: 'e3',
        name: 'Saudação ao Sol',
        sets: '3',
        reps: '1 min',
        instructions: 'Flua com a respiração.',
      },
    ],
  },
]

const INITIAL_PUBLIC_USERS: PublicUser[] = [
  {
    id: '101',
    name: 'Carlos Silva',
    role: 'trainer',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=101',
    bio: 'Especialista em Hipertrofia',
  },
  {
    id: '102',
    name: 'Ana Souza',
    role: 'trainer',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=102',
    bio: 'Yoga e Bem-estar',
  },
  {
    id: 'u1',
    name: 'João Paulo',
    role: 'subscriber',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=10',
    bio: 'Focado em resultados',
  },
  {
    id: 'u2',
    name: 'Maria Clara',
    role: 'subscriber',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=11',
    bio: 'Amante de corridas',
  },
]

const INITIAL_FOLLOWING = [
  { followerId: 'u1', followingId: '101' },
  { followerId: 'u2', followingId: '101' },
]

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'u1',
    receiverId: '101',
    content: 'Olá Carlos, adorei o treino de ontem!',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  },
]

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS)
  const [reviews, setReviews] = useState<Review[]>([])
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [publicUsers] = useState<PublicUser[]>(INITIAL_PUBLIC_USERS)
  const [following, setFollowing] = useState(INITIAL_FOLLOWING)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)

  const addWorkout = useCallback(
    (workoutData: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>) => {
      const newWorkout: Workout = {
        ...workoutData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        trainerName: 'Você',
      }
      setWorkouts((prev) => [...prev, newWorkout])
      logger.info(`Workout created: ${newWorkout.title}`)
      toast.success('Treino criado com sucesso!')
    },
    [],
  )

  const updateWorkout = useCallback((id: string, data: Partial<Workout>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...data } : w)),
    )
    logger.info(`Workout updated: ${id}`)
    toast.success('Treino atualizado!')
  }, [])

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
    logger.info(`Workout deleted: ${id}`)
    toast.success('Treino excluído.')
  }, [])

  const getWorkoutsByTrainer = useCallback(
    (trainerId: string) => {
      return workouts.filter((w) => w.trainerId === trainerId)
    },
    [workouts],
  )

  const addReview = useCallback(
    (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
      const newReview: Review = {
        ...reviewData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      }
      setReviews((prev) => [newReview, ...prev])
      toast.success('Avaliação enviada!')
    },
    [],
  )

  const getReviewsByWorkout = useCallback(
    (workoutId: string) => {
      return reviews.filter((r) => r.workoutId === workoutId)
    },
    [reviews],
  )

  const addProgressLog = useCallback((logData: Omit<ProgressLog, 'id'>) => {
    const newLog: ProgressLog = {
      ...logData,
      id: Math.random().toString(36).substr(2, 9),
    }
    setProgressLogs((prev) => [newLog, ...prev])
    toast.success('Progresso registrado!')
  }, [])

  const getUserProgress = useCallback(
    (userId: string) => {
      return progressLogs.filter((log) => log.userId === userId)
    },
    [progressLogs],
  )

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        read: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    },
    [],
  )

  const followUser = useCallback((followerId: string, followingId: string) => {
    setFollowing((prev) => {
      if (
        prev.some(
          (f) => f.followerId === followerId && f.followingId === followingId,
        )
      )
        return prev
      return [...prev, { followerId, followingId }]
    })
    toast.success('Você começou a seguir este usuário!')
  }, [])

  const unfollowUser = useCallback(
    (followerId: string, followingId: string) => {
      setFollowing((prev) =>
        prev.filter(
          (f) =>
            !(f.followerId === followerId && f.followingId === followingId),
        ),
      )
      toast.info('Você deixou de seguir este usuário.')
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
    (userId: string, trainerId: string, workoutId: string) => {
      const newAssignment: Assignment = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        trainerId,
        workoutId,
        assignedAt: new Date().toISOString(),
        status: 'pending',
      }
      setAssignments((prev) => [...prev, newAssignment])
      toast.success('Treino atribuído com sucesso!')
    },
    [],
  )

  const sendMessage = useCallback(
    (senderId: string, receiverId: string, content: string) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        read: false,
      }
      setMessages((prev) => [...prev, newMessage])
    },
    [],
  )

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
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
