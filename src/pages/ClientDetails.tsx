import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, TrendingUp, Calendar, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

export default function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { publicUsers, getUserProgress, workouts, assignWorkout, assignments } =
    useData()
  const { user } = useAuth()
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const client = publicUsers.find((u) => u.id === id)
  const progressLogs = id ? getUserProgress(id) : []
  const trainerId = user?.id === '1' ? '101' : user?.id || ''
  const myWorkouts = workouts.filter((w) => w.trainerId === trainerId)

  const clientAssignments = assignments.filter(
    (a) => a.userId === id && a.trainerId === trainerId,
  )

  if (!client) {
    return (
      <div className="container py-20 text-center">Aluno não encontrado.</div>
    )
  }

  const handleAssign = async () => {
    if (selectedWorkout && id && !isAssigning) {
      setIsAssigning(true)
      try {
        await assignWorkout(id, trainerId, selectedWorkout)
        setSelectedWorkout('')
      } finally {
        setIsAssigning(false)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <Button
        variant="ghost"
        className="mb-4 pl-0"
        onClick={() => navigate('/trainer-dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
      </Button>

      <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
        <Card className="w-full md:w-1/3">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={client.avatar} />
              <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground mb-4">
              {client.bio || 'Sem biografia'}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full text-sm">
              <div className="bg-secondary/50 p-2 rounded">
                <p className="font-bold">{progressLogs.length}</p>
                <p className="text-muted-foreground">Treinos</p>
              </div>
              <div className="bg-secondary/50 p-2 rounded">
                <p className="font-bold">
                  {progressLogs.reduce((acc, log) => acc + log.duration, 0)} min
                </p>
                <p className="text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-2/3 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Treinos Atribuídos</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Atribuir Treino
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Atribuir Treino para {client.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <Select
                      onValueChange={setSelectedWorkout}
                      value={selectedWorkout}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um treino" />
                      </SelectTrigger>
                      <SelectContent>
                        {myWorkouts.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full"
                      onClick={handleAssign}
                      disabled={!selectedWorkout || isAssigning}
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atribuindo...
                        </>
                      ) : (
                        'Confirmar Atribuição'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {clientAssignments.length > 0 ? (
                <ul className="space-y-2">
                  {clientAssignments.map((assignment) => {
                    const workout = workouts.find(
                      (w) => w.id === assignment.workoutId,
                    )
                    return (
                      <li
                        key={assignment.id}
                        className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg"
                      >
                        <span>{workout?.title || 'Treino removido'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhum treino atribuído recentemente.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressLogs.length > 0 ? (
                  progressLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{log.workoutTitle}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">
                          {log.duration} min
                        </span>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma atividade registrada.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
