import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { Loading } from './components/Loading'

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
const ProgressHistory = React.lazy(() => import('./pages/ProgressHistory'))
const Social = React.lazy(() => import('./pages/Social'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const ClientDetails = React.lazy(() => import('./pages/ClientDetails'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/trainers" element={<ForTrainers />} />
            <Route path="/plans" element={<SubscriptionPlans />} />
            <Route path="/dashboard" element={<SubscriberDashboard />} />
            <Route path="/workout/:id" element={<WorkoutDetails />} />
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/client/:id" element={<ClientDetails />} />
            <Route path="/create-workout" element={<CreateEditWorkout />} />
            <Route path="/edit-workout/:id" element={<CreateEditWorkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/progress" element={<ProgressHistory />} />
            <Route path="/social" element={<Social />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
