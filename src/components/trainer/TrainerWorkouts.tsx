import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'
import { Workout } from '@/context/DataContext'

interface TrainerWorkoutsProps {
  workouts: Workout[]
  onDelete: (id: string) => void
}

export function TrainerWorkouts({ workouts, onDelete }: TrainerWorkoutsProps) {
  return (
    <div className="rounded-md border animate-fade-in overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dificuldade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.length > 0 ? (
              workouts.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell className="font-medium">{workout.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        workout.status === 'published' ? 'default' : 'secondary'
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
                        onClick={() => onDelete(workout.id)}
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
      </div>
    </div>
  )
}
