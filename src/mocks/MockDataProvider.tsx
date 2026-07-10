import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import {
  DataContext,
  type Assignment,
  type Message,
  type Notification,
  type ProgressLog,
  type PublicUser,
  type Review,
  type Workout,
} from '@/context/DataContext'
import type { FollowRelation } from '@/services/social'
import { mockStore } from './store'

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({
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

  const refreshData = useCallback(() => {
    setWorkouts(mockStore.workouts.map((item) => ({ ...item })))
    setReviews(mockStore.reviews.map((item) => ({ ...item })))
    setFollowing(mockStore.listFollows())
    setPublicUsers(mockStore.getPublicUsers())

    if (user) {
      setNotifications(mockStore.listNotifications(user.id, 1, 30).data)
      setProgressLogs(mockStore.listProgressLogs(user.id))
      setMessages(mockStore.listMessages(user.id))
      setAssignments(mockStore.listAssignments(user.id))
    } else {
      setNotifications([])
      setProgressLogs([])
      setMessages([])
      setAssignments([])
    }
  }, [user])

  useEffect(() => {
    refreshData()
    return mockStore.subscribe(refreshData)
  }, [refreshData])

  const addWorkout = useCallback(
    (workoutData: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>) => {
      mockStore.addWorkout(workoutData)
      toast.success('Treino criado com sucesso!')
    },
    [],
  )

  const updateWorkout = useCallback(
    (id: string, data: Partial<Workout>) => {
      if (!user) {
        toast.error('Você precisa estar logado para atualizar treinos.')
        return
      }
      const workout = mockStore.getWorkoutById(id)
      if (!workout) {
        toast.error('Treino não encontrado.')
        return
      }
      if (workout.trainerId !== user.id && user.role !== 'admin') {
        toast.error('Você não tem permissão para atualizar este treino.')
        return
      }
      mockStore.updateWorkout(id, data)
      toast.success('Treino atualizado!')
    },
    [user],
  )

  const deleteWorkout = useCallback(
    (id: string) => {
      if (!user) {
        toast.error('Você precisa estar logado para excluir treinos.')
        return
      }
      const workout = mockStore.getWorkoutById(id)
      if (!workout) {
        toast.error('Treino não encontrado.')
        return
      }
      if (workout.trainerId !== user.id && user.role !== 'admin') {
        toast.error('Você não tem permissão para excluir este treino.')
        return
      }
      mockStore.deleteWorkout(id)
      toast.success('Treino excluído.')
    },
    [user],
  )

  const getWorkoutsByTrainer = useCallback(
    (trainerId: string) => workouts.filter((w) => w.trainerId === trainerId),
    [workouts],
  )

  const addReview = useCallback((reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    mockStore.addReview(reviewData)
    toast.success('Avaliação enviada!')
  }, [])

  const getReviewsByWorkout = useCallback(
    (workoutId: string) => reviews.filter((r) => r.workoutId === workoutId),
    [reviews],
  )

  const addProgressLog = useCallback((logData: Omit<ProgressLog, 'id'>) => {
    mockStore.addProgressLog(logData)
    toast.success('Progresso registrado!')
  }, [])

  const getUserProgress = useCallback(
    (userId: string) => progressLogs.filter((log) => log.userId === userId),
    [progressLogs],
  )

  const markNotificationAsRead = useCallback((id: string) => {
    mockStore.markNotificationRead(id)
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      mockStore.addNotification(notification)
    },
    [],
  )

  const followUser = useCallback(
    (followerId: string, followingId: string) => {
      mockStore.follow(followerId, followingId)
      toast.success('Solicitação de seguimento enviada!')
      mockStore.addNotification({
        userId: followingId,
        message: 'Você tem uma nova solicitação de seguidor.',
        type: 'new_follower',
        link: '/social',
      })
    },
    [],
  )

  const unfollowUser = useCallback(
    (followerId: string, followingId: string) => {
      mockStore.unfollow(followerId, followingId)
      toast.info('Você deixou de seguir este usuário.')
    },
    [],
  )

  const acceptFollowRequest = useCallback(
    (followerId: string, followingId: string) => {
      mockStore.acceptFollow(followerId, followingId)
      toast.success('Solicitação aceita!')
    },
    [],
  )

  const rejectFollowRequest = useCallback(
    (followerId: string, followingId: string) => {
      mockStore.rejectFollow(followerId, followingId)
      toast.info('Solicitação recusada.')
    },
    [],
  )

  const isFollowing = useCallback(
    (followerId: string, followingId: string) =>
      following.some(
        (f) =>
          f.followerId === followerId &&
          f.followingId === followingId &&
          f.status === 'accepted',
      ),
    [following],
  )

  const isPending = useCallback(
    (followerId: string, followingId: string) =>
      following.some(
        (f) =>
          f.followerId === followerId &&
          f.followingId === followingId &&
          f.status === 'pending',
      ),
    [following],
  )

  const assignWorkout = useCallback(
    (userId: string, trainerId: string, workoutId: string) => {
      if (!user) {
        toast.error('Você precisa estar logado para atribuir treinos.')
        return
      }
      if (user.role !== 'trainer' && user.role !== 'admin') {
        toast.error('Apenas trainers podem atribuir treinos.')
        return
      }
      if (trainerId !== user.id && user.role !== 'admin') {
        toast.error(
          'Você não tem permissão para atribuir treinos como este trainer.',
        )
        return
      }
      const workout = mockStore.getWorkoutById(workoutId)
      if (!workout) {
        toast.error('Treino não encontrado.')
        return
      }
      if (workout.trainerId !== trainerId && user.role !== 'admin') {
        toast.error('Você só pode atribuir seus próprios treinos.')
        return
      }

      mockStore.assignWorkout(userId, trainerId, workoutId)
      toast.success('Treino atribuído com sucesso!')
      mockStore.addNotification({
        userId,
        message: 'Você recebeu um novo treino do seu treinador.',
        type: 'workout_assignment',
        link: '/dashboard',
      })
    },
    [user],
  )

  const sendMessage = useCallback(
    (senderId: string, receiverId: string, content: string) => {
      mockStore.sendMessage(senderId, receiverId, content)
    },
    [],
  )

  const searchUsers = useCallback(async (query: string) => {
    return mockStore.searchUsers(query)
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
