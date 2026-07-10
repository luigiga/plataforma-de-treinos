import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MockAuthProvider } from '@/mocks/MockAuthProvider'
import { MockDataProvider } from '@/mocks/MockDataProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import SubscriberDashboard from '@/pages/SubscriberDashboard'
import TrainerDashboard from '@/pages/TrainerDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import WorkoutDetails from '@/pages/WorkoutDetails'
import PublicProfile from '@/pages/PublicProfile'
import Social from '@/pages/Social'
import Profile from '@/pages/Profile'
import Auth from '@/pages/Auth'
import Index from '@/pages/Index'
import CreateEditWorkout from '@/pages/CreateEditWorkout'
import ClientDetails from '@/pages/ClientDetails'

function TestProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode
  initialEntries?: string[]
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <MockDataProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </MockDataProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  )
}

/** App mínima com rotas principais para testes de integração em modo mock. */
export function MockAppRoutes({
  initialEntries = ['/auth'],
}: {
  initialEntries?: string[]
}) {
  return (
    <TestProviders initialEntries={initialEntries}>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/auth"
            element={
              <ProtectedRoute redirectIfAuthenticated>
                <Auth />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['subscriber']}>
                <SubscriberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-workout"
            element={
              <ProtectedRoute allowedRoles={['trainer', 'admin']}>
                <CreateEditWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-workout/:id"
            element={
              <ProtectedRoute allowedRoles={['trainer', 'admin']}>
                <CreateEditWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/client/:id"
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <ClientDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/workout/:id" element={<WorkoutDetails />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <Social />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </TestProviders>
  )
}
