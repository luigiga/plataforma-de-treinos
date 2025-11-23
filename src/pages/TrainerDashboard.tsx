import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrainerOverview } from '@/components/trainer/TrainerOverview'
import { TrainerClients } from '@/components/trainer/TrainerClients'
import { TrainerWorkouts } from '@/components/trainer/TrainerWorkouts'
import { TrainerMessages } from '@/components/trainer/TrainerMessages'
import { CalendarSync } from '@/components/CalendarSync'

export default function TrainerDashboard() {
  const { user } = useAuth()
  const { getWorkoutsByTrainer, deleteWorkout, following, publicUsers } =
    useData()

  const trainerId = user?.id === '1' ? '101' : user?.id || ''
  const trainerWorkouts = getWorkoutsByTrainer(trainerId)

  const myClients = following
    .filter((f) => f.followingId === trainerId)
    .map((f) => publicUsers.find((u) => u.id === f.followerId))
    .filter((u): u is typeof u & {} => !!u)

  if (!user || user.role !== 'trainer') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-8">
          Esta página é exclusiva para Personal Trainers.
        </p>
        <Button asChild>
          <Link to="/auth?tab=login">Fazer Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel do Treinador</h1>
          <p className="text-muted-foreground">
            Gerencie seus alunos e treinos em um só lugar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <CalendarSync
            label="Sincronizar Agenda"
            eventTitle="Sessões de Treino"
            eventDescription="Agenda de alunos da FitPlatform"
          />
          <Button
            asChild
            className="shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            <Link to="/create-workout">
              <Plus className="mr-2 h-4 w-4" /> Novo Treino
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-4 w-full lg:w-[600px] bg-secondary/30 p-1 rounded-xl h-auto">
          <TabsTrigger value="overview" className="rounded-lg w-full">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="clients" className="rounded-lg w-full">
            Alunos
          </TabsTrigger>
          <TabsTrigger value="workouts" className="rounded-lg w-full">
            Treinos
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-lg w-full">
            Mensagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TrainerOverview
            totalWorkouts={trainerWorkouts.length}
            totalClients={myClients.length}
          />
        </TabsContent>
        <TabsContent value="clients">
          <TrainerClients clients={myClients} />
        </TabsContent>
        <TabsContent value="workouts">
          <TrainerWorkouts
            workouts={trainerWorkouts}
            onDelete={deleteWorkout}
          />
        </TabsContent>
        <TabsContent value="messages">
          <TrainerMessages />
        </TabsContent>
      </Tabs>
    </div>
  )
}
