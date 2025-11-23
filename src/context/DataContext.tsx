import React, { createContext, useContext, useState } from 'react'
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

interface DataContextType {
  workouts: Workout[]
  addWorkout: (
    workout: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>,
  ) => void
  updateWorkout: (id: string, workout: Partial<Workout>) => void
  deleteWorkout: (id: string) => void
  getWorkoutsByTrainer: (trainerId: string) => Workout[]
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS)

  const addWorkout = (
    workoutData: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>,
  ) => {
    // In a real app, we would get the trainer name from the auth context or backend
    const newWorkout: Workout = {
      ...workoutData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      trainerName: 'Você', // Placeholder for current user
    }
    setWorkouts([...workouts, newWorkout])
    toast.success('Treino criado com sucesso!')
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

  return (
    <DataContext.Provider
      value={{
        workouts,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        getWorkoutsByTrainer,
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
