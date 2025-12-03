import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from './components/Layout'
import { Loading } from './components/Loading'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'

// Lazy load pages for performance optimization
const Index = React.lazy(() => import('./pages/Index'))
const Auth = React.lazy(() => import('./pages/Auth'))
const ForTrainers = React.lazy(() => import('./pages/ForTrainers'))
const SubscriptionPlans = React.lazy(() => import('./pages/SubscriptionPlans'))
const SubscriberDashboard = React.lazy(
  () => import('./pages/SubscriberDashboard'),
)
const WorkoutDetails = React.lazy(() => import('./pages/WorkoutDetails'))
const TrainerDashboard = React.lazy(() => import('./pages/TrainerDashboard'))
const CreateEditWorkout = React.lazy(() => import('./pages/CreateEditWorkout'))
const Profile = React.lazy(() => import('./pages/Profile'))
const PublicProfile = React.lazy(() => import('./pages/PublicProfile'))
const ProgressHistory = React.lazy(() => import('./pages/ProgressHistory'))
const Social = React.lazy(() => import('./pages/Social'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const ClientDetails = React.lazy(() => import('./pages/ClientDetails'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const EmailConfirm = React.lazy(() => import('./pages/EmailConfirm'))

const App = () => (
  <ErrorBoundary>
    <BrowserRouter
      future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route element={<Layout />}>
                {/* Rotas públicas */}
                <Route path="/" element={<Index />} />
                <Route
                  path="/auth"
                  element={
                    <ProtectedRoute redirectIfAuthenticated>
                      <Auth />
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth/confirm" element={<EmailConfirm />} />
                <Route
                  path="/login"
                  element={
                    <ProtectedRoute redirectIfAuthenticated>
                      <Auth />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <ProtectedRoute redirectIfAuthenticated>
                      <Auth />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <ProtectedRoute redirectIfAuthenticated>
                      <Auth />
                    </ProtectedRoute>
                  }
                />
                <Route path="/trainers" element={<ForTrainers />} />
                <Route path="/plans" element={<SubscriptionPlans />} />
                <Route path="/workout/:id" element={<WorkoutDetails />} />
                <Route path="/profile/:username" element={<PublicProfile />} />

                {/* Rotas protegidas - Requer autenticação */}
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
                  path="/trainer/client/:id"
                  element={
                    <ProtectedRoute allowedRoles={['trainer']}>
                      <ClientDetails />
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
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute allowedRoles={['subscriber']}>
                      <ProgressHistory />
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
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
)

export default App
