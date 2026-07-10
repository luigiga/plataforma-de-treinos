import type { User } from '@/context/AuthContext'
import type {
  Assignment,
  Exercise,
  Message,
  Notification,
  ProgressLog,
  PublicUser,
  Review,
  Workout,
} from '@/context/DataContext'
import type { FollowRelation } from '@/services/social'

const now = new Date()
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

export const MOCK_PASSWORD = 'demo123'

export const mockUsers: User[] = [
  {
    id: 'mock-admin-1',
    username: 'admin',
    full_name: 'Admin FitPlatform',
    name: 'Admin FitPlatform',
    email: 'admin@demo.local',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    bio: 'Administrador da plataforma (modo mock).',
    status: 'active',
    plan: 'vip',
    subscriptionStatus: 'active',
    points: 0,
    badges: ['admin'],
    preferences: [],
    notificationPreferences: {
      newFollower: true,
      newMessage: true,
      workoutAssignment: true,
      systemUpdates: true,
    },
  },
  {
    id: 'mock-trainer-1',
    username: 'ana_trainer',
    full_name: 'Ana Silva',
    name: 'Ana Silva',
    email: 'trainer@demo.local',
    role: 'trainer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
    bio: 'Personal trainer focada em hipertrofia e mobilidade.',
    status: 'active',
    plan: 'premium',
    subscriptionStatus: 'active',
    points: 420,
    badges: ['top_trainer'],
    preferences: ['Força', 'Mobilidade'],
    socialLinks: {
      instagram: 'https://instagram.com/ana_trainer',
      website: 'https://example.com/ana',
    },
    notificationPreferences: {
      newFollower: true,
      newMessage: true,
      workoutAssignment: true,
      systemUpdates: true,
    },
  },
  {
    id: 'mock-trainer-2',
    username: 'bruno_coach',
    full_name: 'Bruno Costa',
    name: 'Bruno Costa',
    email: 'bruno@demo.local',
    role: 'trainer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno',
    bio: 'Especialista em condicionamento e HIIT.',
    status: 'active',
    plan: 'basic',
    subscriptionStatus: 'active',
    points: 210,
    badges: [],
    preferences: ['Cardio', 'HIIT'],
    notificationPreferences: {
      newFollower: true,
      newMessage: true,
      workoutAssignment: true,
      systemUpdates: false,
    },
  },
  {
    id: 'mock-sub-1',
    username: 'carla_aluno',
    full_name: 'Carla Mendes',
    name: 'Carla Mendes',
    email: 'aluno@demo.local',
    role: 'subscriber',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carla',
    bio: 'Aluna em busca de consistência nos treinos.',
    status: 'active',
    plan: 'basic',
    subscriptionStatus: 'active',
    points: 180,
    badges: ['first_workout'],
    preferences: ['Força', 'Cardio'],
    notificationPreferences: {
      newFollower: true,
      newMessage: true,
      workoutAssignment: true,
      systemUpdates: true,
    },
  },
  {
    id: 'mock-sub-2',
    username: 'diego_fit',
    full_name: 'Diego Rocha',
    name: 'Diego Rocha',
    email: 'diego@demo.local',
    role: 'subscriber',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego',
    bio: 'Iniciante focado em hábitos saudáveis.',
    status: 'active',
    plan: 'free',
    subscriptionStatus: 'inactive',
    points: 40,
    badges: [],
    preferences: ['Iniciante', 'Mobilidade'],
    notificationPreferences: {
      newFollower: true,
      newMessage: true,
      workoutAssignment: true,
      systemUpdates: true,
    },
  },
]

const fullBodyExercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Agachamento livre',
    sets: '4',
    reps: '10',
    instructions: 'Mantenha o tronco ereto e desça até a linha dos joelhos.',
  },
  {
    id: 'ex-2',
    name: 'Supino reto',
    sets: '4',
    reps: '8',
    instructions: 'Controle a descida e evite arquear demais a lombar.',
  },
  {
    id: 'ex-3',
    name: 'Remada curvada',
    sets: '3',
    reps: '12',
    instructions: 'Puxe o peso em direção ao umbigo, ombros estáveis.',
  },
]

const hiitExercises: Exercise[] = [
  {
    id: 'ex-4',
    name: 'Burpee',
    sets: '4',
    reps: '12',
    instructions: 'Mantenha ritmo constante e aterrissagem suave.',
  },
  {
    id: 'ex-5',
    name: 'Mountain climbers',
    sets: '4',
    reps: '40s',
    instructions: 'Quadril baixo e core ativado durante todo o intervalo.',
  },
  {
    id: 'ex-6',
    name: 'Jumping jack',
    sets: '3',
    reps: '45s',
    instructions: 'Movimento amplo dos braços, aterrissagem leve.',
  },
]

const mobilityExercises: Exercise[] = [
  {
    id: 'ex-7',
    name: 'Cat-cow',
    sets: '3',
    reps: '10',
    instructions: 'Sincronize respiração com o movimento da coluna.',
  },
  {
    id: 'ex-8',
    name: "World's greatest stretch",
    sets: '3',
    reps: '6/lado',
    instructions: 'Abra o peito e mantenha o joelho alinhado.',
  },
]

export const mockWorkouts: Workout[] = [
  {
    id: 'workout-1',
    trainerId: 'mock-trainer-1',
    trainerName: 'Ana Silva',
    title: 'Full Body Força',
    description:
      'Treino completo para ganho de força com foco em padrões básicos.',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    duration: 55,
    difficulty: 'Intermediário',
    category: ['Força', 'Full Body'],
    exercises: fullBodyExercises,
    status: 'published',
    createdAt: daysAgo(5),
    isCircuit: false,
    price: 0,
    isPaid: false,
    purchaseType: 'free',
  },
  {
    id: 'workout-2',
    trainerId: 'mock-trainer-1',
    trainerName: 'Ana Silva',
    title: 'Mobilidade Matinal',
    description: 'Rotina curta para liberar quadril, coluna e ombros.',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    duration: 25,
    difficulty: 'Iniciante',
    category: ['Mobilidade', 'Iniciante'],
    exercises: mobilityExercises,
    status: 'published',
    createdAt: daysAgo(3),
    isCircuit: false,
    price: 0,
    isPaid: false,
    purchaseType: 'free',
  },
  {
    id: 'workout-3',
    trainerId: 'mock-trainer-2',
    trainerName: 'Bruno Costa',
    title: 'HIIT Condicionamento',
    description: 'Circuito intenso para elevar o condicionamento cardiovascular.',
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
    duration: 35,
    difficulty: 'Avançado',
    category: ['Cardio', 'HIIT'],
    exercises: hiitExercises,
    status: 'published',
    createdAt: daysAgo(2),
    isCircuit: true,
    price: 49.9,
    isPaid: true,
    purchaseType: 'one_time',
  },
  {
    id: 'workout-4',
    trainerId: 'mock-trainer-2',
    trainerName: 'Bruno Costa',
    title: 'Rascunho: Core Express',
    description: 'Treino em rascunho — só o trainer vê.',
    image:
      'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=1200&q=80',
    duration: 20,
    difficulty: 'Iniciante',
    category: ['Core'],
    exercises: [
      {
        id: 'ex-9',
        name: 'Prancha',
        sets: '3',
        reps: '40s',
        instructions: 'Mantenha o corpo alinhado e respire de forma controlada.',
      },
    ],
    status: 'draft',
    createdAt: daysAgo(1),
    isCircuit: false,
    price: 0,
    isPaid: false,
    purchaseType: 'free',
  },
]

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    workoutId: 'workout-1',
    userId: 'mock-sub-1',
    userName: 'Carla Mendes',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carla',
    rating: 5,
    comment: 'Excelente progressão e bem explicado!',
    createdAt: daysAgo(2),
  },
  {
    id: 'review-2',
    workoutId: 'workout-2',
    userId: 'mock-sub-2',
    userName: 'Diego Rocha',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego',
    rating: 4,
    comment: 'Perfeito para começar o dia.',
    createdAt: daysAgo(1),
  },
]

export const mockFollows: FollowRelation[] = [
  {
    followerId: 'mock-sub-1',
    followingId: 'mock-trainer-1',
    status: 'accepted',
  },
  {
    followerId: 'mock-sub-2',
    followingId: 'mock-trainer-1',
    status: 'pending',
  },
  {
    followerId: 'mock-sub-1',
    followingId: 'mock-trainer-2',
    status: 'accepted',
  },
]

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'mock-sub-1',
    message: 'Ana Silva atribuiu o treino Full Body Força para você.',
    read: false,
    createdAt: daysAgo(1),
    link: '/dashboard',
    type: 'workout_assignment',
  },
  {
    id: 'notif-2',
    userId: 'mock-trainer-1',
    message: 'Você tem uma nova solicitação de seguidor.',
    read: false,
    createdAt: daysAgo(1),
    link: '/social',
    type: 'new_follower',
  },
  {
    id: 'notif-3',
    userId: 'mock-sub-1',
    message: 'Bem-vinda ao modo mock da FitPlatform!',
    read: true,
    createdAt: daysAgo(4),
    type: 'info',
  },
]

export const mockProgressLogs: ProgressLog[] = [
  {
    id: 'progress-1',
    userId: 'mock-sub-1',
    workoutId: 'workout-1',
    workoutTitle: 'Full Body Força',
    date: daysAgo(1),
    duration: 52,
    notes: 'Boa sessão, aumentei carga no agachamento.',
  },
]

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    userId: 'mock-sub-1',
    trainerId: 'mock-trainer-1',
    workoutId: 'workout-1',
    assignedAt: daysAgo(2),
    status: 'pending',
  },
]

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'mock-trainer-1',
    receiverId: 'mock-sub-1',
    content: 'Oi Carla! Como foi o treino de ontem?',
    timestamp: daysAgo(1),
    read: false,
  },
  {
    id: 'msg-2',
    senderId: 'mock-sub-1',
    receiverId: 'mock-trainer-1',
    content: 'Foi ótimo! Quero evoluir a carga na próxima semana.',
    timestamp: daysAgo(1),
    read: true,
  },
]

export function toPublicUser(user: User): PublicUser | null {
  if (user.role === 'admin') return null
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar || '',
    bio: user.bio,
    socialLinks: user.socialLinks,
  }
}

export const mockQuickLogins = [
  {
    label: 'Aluno',
    email: 'aluno@demo.local',
    description: 'Dashboard do assinante',
  },
  {
    label: 'Trainer',
    email: 'trainer@demo.local',
    description: 'Painel do personal',
  },
  {
    label: 'Admin',
    email: 'admin@demo.local',
    description: 'Painel administrativo',
  },
] as const
