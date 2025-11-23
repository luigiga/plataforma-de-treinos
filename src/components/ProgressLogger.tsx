import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ProgressLoggerProps {
  workoutId: string
  workoutTitle: string
}

export function ProgressLogger({
  workoutId,
  workoutTitle,
}: ProgressLoggerProps) {
  const { addProgressLog } = useData()
  const { user, updateUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    addProgressLog({
      userId: user.id,
      workoutId,
      workoutTitle,
      date: new Date().toISOString(),
      duration: Number(duration),
      notes,
    })

    // Gamification Logic
    const newPoints = (user.points || 0) + 10
    const newBadges = [...(user.badges || [])]

    if (!newBadges.includes('focused')) {
      // Simple check: if points > 50 (approx 5 workouts), award badge
      if (newPoints >= 50) {
        newBadges.push('focused')
        toast.success('Nova Conquista: Focado! (Completou 5 treinos)')
      }
    }

    if (!newBadges.includes('master') && newPoints >= 1000) {
      newBadges.push('master')
      toast.success('Nova Conquista: Mestre! (1000 pontos)')
    }

    updateUser({ points: newPoints, badges: newBadges })
    toast.success('Você ganhou +10 XP!')

    setOpen(false)
    setDuration('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full btn-press">
          <PlusCircle className="mr-2 h-4 w-4" /> Registrar Progresso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Treino</DialogTitle>
          <DialogDescription>
            Salve seus resultados para acompanhar sua evolução e ganhar XP.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 45"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas / Cargas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Supino 20kg, Agachamento 30kg..."
              className="h-24"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Salvar Registro (+10 XP)</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
