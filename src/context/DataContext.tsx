import React, { createContext, useContext, useState } from 'react'
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

interface DataContextType {
  workouts: Workout[]
  reviews: Review[]
  progressLogs: ProgressLog[]
  notifications: Notification[]
  publicUsers: PublicUser[]
  following: { followerId: string; followingId: string }[]
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS)
  const [reviews, setReviews] = useState<Review[]>([])
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [publicUsers] = useState<PublicUser[]>(INITIAL_PUBLIC_USERS)
  const [following, setFollowing] = useState<
    { followerId: string; followingId: string }[]
  >([])

  const addWorkout = (
    workoutData: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>,
  ) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      trainerName: 'Você',
    }
    setWorkouts([...workouts, newWorkout])
    logger.info(`Workout created: ${newWorkout.title}`)
    toast.success('Treino criado com sucesso!')
  }

  const updateWorkout = (id: string, data: Partial<Workout>) => {
    setWorkouts(workouts.map((w) => (w.id === id ? { ...w, ...data } : w)))
    logger.info(`Workout updated: ${id}`)
    toast.success('Treino atualizado!')
  }

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter((w) => w.id !== id))
    logger.info(`Workout deleted: ${id}`)
    toast.success('Treino excluído.')
  }

  const getWorkoutsByTrainer = (trainerId: string) =>
    workouts.filter((w) => w.trainerId === trainerId)

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    setReviews([newReview, ...reviews])
    toast.success('Avaliação enviada!')
  }

  const getReviewsByWorkout = (workoutId: string) =>
    reviews.filter((r) => r.workoutId === workoutId)

  const addProgressLog = (logData: Omit<ProgressLog, 'id'>) => {
    const newLog: ProgressLog = {
      ...logData,
      id: Math.random().toString(36).substr(2, 9),
    }
    setProgressLogs([newLog, ...progressLogs])
    toast.success('Progresso registrado!')
  }

  const getUserProgress = (userId: string) =>
    progressLogs.filter((log) => log.userId === userId)

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const addNotification = (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
    }
    setNotifications([newNotification, ...notifications])
  }

  const followUser = (followerId: string, followingId: string) => {
    if (
      following.some(
        (f) => f.followerId === followerId && f.followingId === followingId,
      )
    )
      return
    setFollowing([...following, { followerId, followingId }])
    toast.success('Você começou a seguir este usuário!')
    logger.info(`User ${followerId} followed ${followingId}`)
  }

  const unfollowUser = (followerId: string, followingId: string) => {
    setFollowing(
      following.filter(
        (f) => !(f.followerId === followerId && f.followingId === followingId),
      ),
    )
    toast.info('Você deixou de seguir este usuário.')
    logger.info(`User ${followerId} unfollowed ${followingId}`)
  }

  const isFollowing = (followerId: string, followingId: string) => {
    return following.some(
      (f) => f.followerId === followerId && f.followingId === followingId,
    )
  }

  return (
    <DataContext.Provider
      value={{
        workouts,
        reviews,
        progressLogs,
        notifications,
        publicUsers,
        following,
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
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
