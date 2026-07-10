import type { User } from '@/context/AuthContext'
import type {
  Assignment,
  Message,
  Notification,
  ProgressLog,
  PublicUser,
  Review,
  Workout,
} from '@/context/DataContext'
import type { FollowRelation } from '@/services/social'
import type { SearchResult } from '@/services/search'
import {
  MOCK_PASSWORD,
  mockAssignments,
  mockFollows,
  mockMessages,
  mockNotifications,
  mockProgressLogs,
  mockReviews,
  mockUsers,
  mockWorkouts,
  toPublicUser,
} from './fixtures'

const SESSION_KEY = 'fitplatform_mock_session_user_id'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safeSize
  const data = items.slice(start, start + safeSize)

  return {
    data,
    total: items.length,
    page: safePage,
    pageSize: safeSize,
    hasMore: start + safeSize < items.length,
  }
}

class MockStore {
  users: User[] = clone(mockUsers)
  workouts: Workout[] = clone(mockWorkouts)
  reviews: Review[] = clone(mockReviews)
  follows: FollowRelation[] = clone(mockFollows)
  notifications: Notification[] = clone(mockNotifications)
  progressLogs: ProgressLog[] = clone(mockProgressLogs)
  assignments: Assignment[] = clone(mockAssignments)
  messages: Message[] = clone(mockMessages)
  private listeners = new Set<() => void>()

  /** Restaura fixtures e limpa sessão — use em testes. */
  reset() {
    this.users = clone(mockUsers)
    this.workouts = clone(mockWorkouts)
    this.reviews = clone(mockReviews)
    this.follows = clone(mockFollows)
    this.notifications = clone(mockNotifications)
    this.progressLogs = clone(mockProgressLogs)
    this.assignments = clone(mockAssignments)
    this.messages = clone(mockMessages)
    this.setSessionUserId(null)
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  getSessionUserId(): string | null {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(SESSION_KEY)
  }

  setSessionUserId(userId: string | null) {
    if (typeof window === 'undefined') return
    if (userId) sessionStorage.setItem(SESSION_KEY, userId)
    else sessionStorage.removeItem(SESSION_KEY)
  }

  getUserById(id: string) {
    return this.users.find((user) => user.id === id) || null
  }

  getUserByEmail(email: string) {
    return (
      this.users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      ) || null
    )
  }

  getUserByUsername(username: string) {
    return (
      this.users.find(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      ) || null
    )
  }

  getPublicUsers(): PublicUser[] {
    return this.users
      .map(toPublicUser)
      .filter((user): user is PublicUser => Boolean(user))
  }

  login(email: string, password: string) {
    const user = this.getUserByEmail(email)
    if (!user || password !== MOCK_PASSWORD) {
      return {
        user: null,
        error: { message: 'Email ou senha inválidos. Use a senha demo123.' },
      }
    }
    if (user.status === 'inactive') {
      return {
        user: null,
        error: { message: 'Usuário inativo. Contate o suporte.' },
      }
    }
    this.setSessionUserId(user.id)
    return { user: clone(user), error: null }
  }

  register(
    email: string,
    _password: string,
    data: Partial<User>,
  ): { user: User | null; error: { message: string } | null } {
    if (this.getUserByEmail(email)) {
      return {
        user: null,
        error: {
          message:
            'Este e-mail já está registrado. Por favor, use um e-mail diferente ou faça login.',
        },
      }
    }

    if (
      data.username &&
      this.users.some(
        (user) =>
          user.username.toLowerCase() === data.username!.toLowerCase(),
      )
    ) {
      return {
        user: null,
        error: {
          message:
            'Este nome de usuário já está em uso. Por favor, escolha um nome de usuário diferente.',
        },
      }
    }

    const role = data.role === 'trainer' ? 'trainer' : 'subscriber'
    const user: User = {
      id: createId('mock-user'),
      username: data.username || email.split('@')[0] || 'user',
      full_name: data.full_name || data.name || 'Novo usuário',
      name: data.name || data.full_name || 'Novo usuário',
      email,
      role,
      avatar:
        data.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      bio: data.bio || '',
      status: 'active',
      plan: 'free',
      subscriptionStatus: 'inactive',
      points: 0,
      badges: [],
      preferences: data.preferences || [],
      socialLinks: data.socialLinks,
      notificationPreferences: data.notificationPreferences || {
        newFollower: true,
        newMessage: true,
        workoutAssignment: true,
        systemUpdates: true,
      },
    }

    this.users = [user, ...this.users]
    this.setSessionUserId(user.id)
    this.notify()
    return { user: clone(user), error: null }
  }

  logout() {
    this.setSessionUserId(null)
    this.notify()
  }

  updateUser(id: string, data: Partial<User>) {
    this.users = this.users.map((user) => {
      if (user.id !== id) return user
      const next = { ...user, ...data }
      if (data.full_name || data.name || data.username) {
        next.name = data.full_name || data.name || data.username || user.name
        next.full_name =
          data.full_name || data.name || data.username || user.full_name
      }
      return next
    })
    this.notify()
    return this.getUserById(id)
  }

  deleteUser(id: string) {
    this.users = this.users.filter((user) => user.id !== id)
    this.workouts = this.workouts.filter((workout) => workout.trainerId !== id)
    this.follows = this.follows.filter(
      (follow) => follow.followerId !== id && follow.followingId !== id,
    )
    this.notifications = this.notifications.filter((item) => item.userId !== id)
    this.progressLogs = this.progressLogs.filter((item) => item.userId !== id)
    this.assignments = this.assignments.filter(
      (item) => item.userId !== id && item.trainerId !== id,
    )
    this.messages = this.messages.filter(
      (item) => item.senderId !== id && item.receiverId !== id,
    )
    if (this.getSessionUserId() === id) this.setSessionUserId(null)
    this.notify()
  }

  toggleUserStatus(id: string) {
    const user = this.getUserById(id)
    if (!user) return null
    const nextStatus = user.status === 'active' ? 'inactive' : 'active'
    return this.updateUser(id, { status: nextStatus })
  }

  isUsernameAvailable(username: string) {
    return !this.users.some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    )
  }

  listProfiles(params: {
    page?: number
    pageSize?: number
    role?: string
    status?: string
    search?: string
  } = {}) {
    let items = [...this.users]

    if (params.role) {
      items = items.filter((user) => user.role === params.role)
    }
    if (params.status) {
      items = items.filter((user) => user.status === params.status)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (user) =>
          user.name.toLowerCase().includes(q) ||
          user.username.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q),
      )
    }

    return paginate(items, params.page, params.pageSize)
  }

  listWorkouts(params: {
    page?: number
    pageSize?: number
    trainerId?: string
    includeDrafts?: boolean
  } = {}) {
    let items = [...this.workouts]

    if (params.trainerId) {
      items = items.filter((workout) => workout.trainerId === params.trainerId)
    }
    if (!params.includeDrafts) {
      items = items.filter((workout) => workout.status === 'published')
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return paginate(items, params.page, params.pageSize)
  }

  getWorkoutById(id: string) {
    return this.workouts.find((workout) => workout.id === id) || null
  }

  addWorkout(workout: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>) {
    const trainer = this.getUserById(workout.trainerId)
    const created: Workout = {
      ...workout,
      id: createId('workout'),
      createdAt: new Date().toISOString(),
      trainerName: trainer?.name || 'Trainer',
      exercises: workout.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id || createId('ex'),
      })),
    }
    this.workouts = [created, ...this.workouts]
    this.notify()
    return created
  }

  updateWorkout(id: string, data: Partial<Workout>) {
    this.workouts = this.workouts.map((workout) =>
      workout.id === id ? { ...workout, ...data } : workout,
    )
    this.notify()
    return this.getWorkoutById(id)
  }

  deleteWorkout(id: string) {
    this.workouts = this.workouts.filter((workout) => workout.id !== id)
    this.reviews = this.reviews.filter((review) => review.workoutId !== id)
    this.assignments = this.assignments.filter(
      (assignment) => assignment.workoutId !== id,
    )
    this.notify()
  }

  listReviews(workoutId?: string, page = 1, pageSize = 100) {
    let items = [...this.reviews]
    if (workoutId) {
      items = items.filter((review) => review.workoutId === workoutId)
    }
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return paginate(items, page, pageSize)
  }

  addReview(review: Omit<Review, 'id' | 'createdAt'>) {
    const created: Review = {
      ...review,
      id: createId('review'),
      createdAt: new Date().toISOString(),
    }
    this.reviews = [created, ...this.reviews]
    this.notify()
    return created
  }

  listFollows() {
    return clone(this.follows)
  }

  follow(followerId: string, followingId: string) {
    const exists = this.follows.some(
      (item) =>
        item.followerId === followerId && item.followingId === followingId,
    )
    if (!exists) {
      this.follows = [
        ...this.follows,
        { followerId, followingId, status: 'pending' },
      ]
      this.notify()
    }
  }

  unfollow(followerId: string, followingId: string) {
    this.follows = this.follows.filter(
      (item) =>
        !(item.followerId === followerId && item.followingId === followingId),
    )
    this.notify()
  }

  acceptFollow(followerId: string, followingId: string) {
    this.follows = this.follows.map((item) =>
      item.followerId === followerId && item.followingId === followingId
        ? { ...item, status: 'accepted' }
        : item,
    )
    this.notify()
  }

  rejectFollow(followerId: string, followingId: string) {
    this.unfollow(followerId, followingId)
  }

  listNotifications(userId: string, page = 1, pageSize = 30) {
    const items = this.notifications
      .filter((item) => item.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    return paginate(items, page, pageSize)
  }

  markNotificationRead(id: string) {
    this.notifications = this.notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    )
    this.notify()
  }

  addNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  ) {
    const created: Notification = {
      ...notification,
      id: createId('notif'),
      createdAt: new Date().toISOString(),
      read: false,
    }
    this.notifications = [created, ...this.notifications]
    this.notify()
    return created
  }

  listProgressLogs(userId: string) {
    return this.progressLogs
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  addProgressLog(log: Omit<ProgressLog, 'id'>) {
    const created: ProgressLog = {
      ...log,
      id: createId('progress'),
      date: log.date || new Date().toISOString(),
    }
    this.progressLogs = [created, ...this.progressLogs]
    this.notify()
    return created
  }

  listMessages(userId: string) {
    return this.messages
      .filter(
        (item) => item.senderId === userId || item.receiverId === userId,
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
  }

  sendMessage(senderId: string, receiverId: string, content: string) {
    const created: Message = {
      id: createId('msg'),
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    }
    this.messages = [created, ...this.messages]
    this.notify()
    return created
  }

  listAssignments(userId: string) {
    return this.assignments
      .filter(
        (item) => item.userId === userId || item.trainerId === userId,
      )
      .sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
      )
  }

  assignWorkout(userId: string, trainerId: string, workoutId: string) {
    const created: Assignment = {
      id: createId('assign'),
      userId,
      trainerId,
      workoutId,
      assignedAt: new Date().toISOString(),
      status: 'pending',
    }
    this.assignments = [created, ...this.assignments]
    this.notify()
    return created
  }

  searchUsers(query: string) {
    const q = query.toLowerCase()
    return this.getPublicUsers().filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q),
    )
  }

  searchGlobal(query: string): SearchResult[] {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    const results: SearchResult[] = []

    this.getPublicUsers()
      .filter(
        (user) =>
          user.name.toLowerCase().includes(q) ||
          user.username.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .forEach((user) => {
        results.push({
          id: user.id,
          type: 'profile',
          title: user.name,
          subtitle: `@${user.username}`,
          image: user.avatar,
          url: `/profile/${user.username}`,
        })
      })

    this.workouts
      .filter(
        (workout) =>
          workout.status === 'published' &&
          (workout.title.toLowerCase().includes(q) ||
            workout.description.toLowerCase().includes(q)),
      )
      .slice(0, 5)
      .forEach((workout) => {
        results.push({
          id: workout.id,
          type: 'workout',
          title: workout.title,
          subtitle: `${workout.difficulty} • ${workout.category.join(', ')}`,
          image: workout.image,
          url: `/workout/${workout.id}`,
        })
      })

    this.workouts
      .flatMap((workout) =>
        workout.exercises.map((exercise) => ({ exercise, workout })),
      )
      .filter(({ exercise }) => exercise.name.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(({ exercise, workout }) => {
        results.push({
          id: exercise.id,
          type: 'exercise',
          title: exercise.name,
          subtitle: 'Exercício',
          url: `/workout/${workout.id}`,
        })
      })

    return results
  }
}

export const mockStore = new MockStore()
