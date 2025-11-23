import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, BarChart, Play, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function WorkoutDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts } = useData()
  const workout = workouts.find((w) => w.id === id)

  if (!workout) {
    return (
      <div className="container py-20 text-center">Treino não encontrado.</div>
    )
  }

  const handleStartWorkout = () => {
    toast.success('Treino iniciado! Bom treino!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-4 pl-0 hover:pl-2 transition-all"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8 shadow-xl">
        <img
          src={workout.image}
          alt={workout.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
          <div className="flex gap-2 mb-4">
            <Badge className="bg-primary text-white border-none">
              {workout.difficulty}
            </Badge>
            {workout.category.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-white border-white/50"
              >
                {cat}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl font-bold mb-2">{workout.title}</h1>
          <p className="text-lg text-gray-200 mb-4">
            por {workout.trainerName}
          </p>
          <div className="flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Clock size={18} /> {workout.duration} min
            </div>
            <div className="flex items-center gap-2">
              <BarChart size={18} /> {workout.exercises.length} exercícios
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Sobre o Treino</h2>
            <p className="text-muted-foreground leading-relaxed">
              {workout.description}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Exercícios</h2>
            <div className="space-y-4">
              {workout.exercises.map((exercise, index) => (
                <Card key={exercise.id} className="overflow-hidden">
                  <CardContent className="p-0 flex flex-col sm:flex-row">
                    <div className="bg-secondary w-full sm:w-32 h-32 flex items-center justify-center text-muted-foreground font-bold text-2xl shrink-0">
                      {index + 1}
                    </div>
                    <div className="p-6 flex-grow">
                      <h3 className="text-xl font-bold mb-2">
                        {exercise.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                        <span>{exercise.sets} Séries</span>
                        <span>•</span>
                        <span>{exercise.reps} Repetições</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {exercise.instructions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-6">
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={handleStartWorkout}
              >
                <Play className="mr-2 fill-current" /> Começar Treino
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Equipamentos Necessários
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">Halteres</Badge>
                  <Badge variant="secondary">Colchonete</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
