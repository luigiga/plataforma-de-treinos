import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, Dumbbell, TrendingUp, Edit, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function TrainerDashboard() {
  const { user } = useAuth()
  const { getWorkoutsByTrainer, deleteWorkout } = useData()

  // In a real app, we would use the user's ID. For mock, we use '101' if user is trainer, else empty
  const trainerWorkouts = user
    ? getWorkoutsByTrainer(user.id === '1' ? '101' : user.id)
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel do Treinador</h1>
          <p className="text-muted-foreground">
            Gerencie seus treinos e acompanhe seu progresso.
          </p>
        </div>
        <Button asChild>
          <Link to="/create-workout">
            <Plus className="mr-2 h-4 w-4" /> Novo Treino
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Treinos
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainerWorkouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assinantes Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% desde o último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 4.500,00</div>
            <p className="text-xs text-muted-foreground">
              +5% desde o último mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workouts List */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dificuldade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainerWorkouts.length > 0 ? (
                trainerWorkouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell className="font-medium">
                      {workout.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          workout.status === 'published'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {workout.status === 'published'
                          ? 'Publicado'
                          : 'Rascunho'}
                      </Badge>
                    </TableCell>
                    <TableCell>{workout.difficulty}</TableCell>
                    <TableCell>
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/edit-workout/${workout.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteWorkout(workout.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Você ainda não criou nenhum treino.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
