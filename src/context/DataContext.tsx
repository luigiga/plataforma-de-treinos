import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Exercise {
  id: string
  name: string
  sets: string
  reps: string
  instructions: string
  videoUrl?: string
}

export interface Workout {
  id: string
  trainerId: string
  trainerName: string
  title: string
  description: string
  image: string
  duration: number // minutes
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'
  category: string[]
  exercises: Exercise[]
  status: 'draft' | 'published'
  createdAt: string
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

interface DataContextType {
  workouts: Workout[]
  reviews: Review[]
  progressLogs: ProgressLog[]
  notifications: Notification[]
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
    exercises: [
      {
        id: 'e1',
        name: 'Supino Reto',
        sets: '4',
        reps: '10',
        instructions: 'Mantenha os cotovelos a 45 graus.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
  {
    id: '3',
    trainerId: '101',
    trainerName: 'Carlos Silva',
    title: 'HIIT Queima Gordura',
    description:
      'Treino intervalado de alta intensidade para queimar calorias.',
    image: 'https://img.usecurling.com/p/800/600?q=cardio%20running',
    duration: 20,
    difficulty: 'Intermediário',
    category: ['Cardio', 'HIIT'],
    status: 'published',
    createdAt: new Date().toISOString(),
    exercises: [],
  },
]

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    workoutId: '1',
    userId: 'u1',
    userName: 'João Paulo',
    userAvatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=10',
    rating: 5,
    comment: 'Treino excelente! Senti muito o peitoral.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'r2',
    workoutId: '1',
    userId: 'u2',
    userName: 'Maria Clara',
    userAvatar:
      'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=11',
    rating: 4,
    comment: 'Muito bom, mas achei o tempo de descanso curto.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
]

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: '1', // Assuming current user ID is 1 for demo
    message: 'Novo treino de Yoga disponível!',
    read: false,
    createdAt: new Date().toISOString(),
    type: 'info',
    link: '/workout/2',
  },
  {
    id: 'n2',
    userId: '1',
    message: 'Parabéns! Você completou 5 treinos essa semana.',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'success',
  },
]

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS)
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS)
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  )

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
    toast.success('Treino criado com sucesso!')

    // Simulate notifying subscribers
    addNotification({
      userId: 'all',
      message: `Novo treino "${newWorkout.title}" foi publicado!`,
      type: 'info',
      link: `/workout/${newWorkout.id}`,
    })
  }

  const updateWorkout = (id: string, data: Partial<Workout>) => {
    setWorkouts(workouts.map((w) => (w.id === id ? { ...w, ...data } : w)))
    toast.success('Treino atualizado!')
  }

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter((w) => w.id !== id))
    toast.success('Treino excluído.')
  }

  const getWorkoutsByTrainer = (trainerId: string) => {
    return workouts.filter((w) => w.trainerId === trainerId)
  }

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    setReviews([newReview, ...reviews])
    toast.success('Avaliação enviada!')
  }

  const getReviewsByWorkout = (workoutId: string) => {
    return reviews.filter((r) => r.workoutId === workoutId)
  }

  const addProgressLog = (logData: Omit<ProgressLog, 'id'>) => {
    const newLog: ProgressLog = {
      ...logData,
      id: Math.random().toString(36).substr(2, 9),
    }
    setProgressLogs([newLog, ...progressLogs])
    toast.success('Progresso registrado!')
  }

  const getUserProgress = (userId: string) => {
    return progressLogs.filter((log) => log.userId === userId)
  }

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

  return (
    <DataContext.Provider
      value={{
        workouts,
        reviews,
        progressLogs,
        notifications,
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
