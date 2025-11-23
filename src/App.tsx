import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Index from './pages/Index'
import Auth from './pages/Auth'
import ForTrainers from './pages/ForTrainers'
import SubscriptionPlans from './pages/SubscriptionPlans'
import SubscriberDashboard from './pages/SubscriberDashboard'
import WorkoutDetails from './pages/WorkoutDetails'
import TrainerDashboard from './pages/TrainerDashboard'
import CreateEditWorkout from './pages/CreateEditWorkout'
import Profile from './pages/Profile'
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/trainers" element={<ForTrainers />} />
          <Route path="/plans" element={<SubscriptionPlans />} />
          <Route path="/dashboard" element={<SubscriberDashboard />} />
          <Route path="/workout/:id" element={<WorkoutDetails />} />
          <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
          <Route path="/create-workout" element={<CreateEditWorkout />} />
          <Route path="/edit-workout/:id" element={<CreateEditWorkout />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
