import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Index from './pages/Index'
import Auth from './pages/Auth'
import ForTrainers from './pages/ForTrainers'
import SubscriptionPlans from './pages/SubscriptionPlans'
import SubscriberDashboard from './pages/SubscriberDashboard'
import WorkoutDetails from './pages/WorkoutDetails'
import TrainerDashboard from './pages/TrainerDashboard'
import CreateEditWorkout from './pages/CreateEditWorkout'
import Profile from './pages/Profile'
import ProgressHistory from './pages/ProgressHistory'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route
            path="/auth"
            element={
              <ProtectedRoute redirectIfAuthenticated>
                <Auth />
              </ProtectedRoute>
            }
          />
          <Route path="/trainers" element={<ForTrainers />} />
          <Route path="/plans" element={<SubscriptionPlans />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['subscriber']}>
                <SubscriberDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/workout/:id" element={<WorkoutDetails />} />
          <Route
            path="/trainer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-workout"
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <CreateEditWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-workout/:id"
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
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
              <ProtectedRoute>
                <ProgressHistory />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
