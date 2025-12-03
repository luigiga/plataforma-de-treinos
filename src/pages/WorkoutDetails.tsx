import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { OptimizedImage } from '@/components/OptimizedImage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Clock,
  BarChart,
  Play,
  ArrowLeft,
  Video,
  Zap,
  Repeat,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { CommentsSection } from '@/components/CommentsSection'
import { ProgressLogger } from '@/components/ProgressLogger'
import { WorkoutPurchaseButton } from '@/components/payments/WorkoutPurchaseButton'
import { useWorkoutAccess } from '@/hooks/use-workout-access'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'

export default function WorkoutDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts } = useData()
  const { user } = useAuth()
  const workout = workouts.find((w) => w.id === id)
  const { data: access, isLoading: accessLoading } = useWorkoutAccess(workout || null)

  if (!workout)
    return (
      <div className="container py-20 text-center">Treino não encontrado.</div>
    )

  const hasAccess = access?.hasAccess ?? false
  const isPaid = workout.isPaid || false
  const purchaseType = workout.purchaseType || 'free'

  const handleStartWorkout = () => {
    if (!hasAccess && isPaid) {
      toast.error('Você precisa ter acesso a este treino para iniciá-lo')
      return
    }
    toast.success('Treino iniciado! Bom treino!')
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl animate-fade-in">
      <Button
        variant="ghost"
        className="mb-4 pl-0 hover:pl-2 transition-all"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="relative h-[250px] md:h-[450px] rounded-3xl overflow-hidden mb-8 shadow-ios-float">
        <OptimizedImage
          src={workout.image}
          alt={workout.title}
          className="w-full h-full object-cover"
          lazy={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8 text-white">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-primary text-white border-none">
              {workout.difficulty}
            </Badge>
            {workout.isCircuit && (
              <Badge variant="destructive" className="gap-1">
                <Zap size={12} /> Circuito
              </Badge>
            )}
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
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            {workout.title}
          </h1>
          <p className="text-base md:text-lg text-gray-200 mb-6">
            por {workout.trainerName}
          </p>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm font-medium">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
              <Clock size={18} /> {workout.duration} min
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
              <BarChart size={18} /> {workout.exercises.length} exercícios
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-10">
          {!hasAccess && isPaid && (
            <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">
                      Conteúdo Bloqueado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {purchaseType === 'subscription'
                        ? 'Este treino requer uma assinatura ativa. Assine um plano para ter acesso a todos os treinos.'
                        : 'Este treino é pago. Compre agora para ter acesso completo.'}
                    </p>
                    {purchaseType === 'subscription' && (
                      <Button
                        onClick={() => navigate('/plans')}
                        className="w-full sm:w-auto"
                      >
                        Ver Planos
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <section>
            <h2 className="text-2xl font-bold mb-4">Sobre o Treino</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {workout.description}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Exercícios</h2>
            {!hasAccess && isPaid ? (
              <Card className="p-8 text-center border-dashed">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Os exercícios estão bloqueados. Adquira acesso para visualizar.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {workout.exercises.map((exercise, index) => (
                <Card
                  key={exercise.id}
                  className="overflow-hidden border-none shadow-elevation"
                >
                  <CardContent className="p-0 flex flex-col sm:flex-row">
                    <div className="bg-secondary w-full sm:w-32 h-40 sm:h-auto min-h-[8rem] flex items-center justify-center text-muted-foreground font-bold text-2xl shrink-0 relative group">
                      {exercise.videoUrl ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                              <div className="bg-white/90 p-3 rounded-full shadow-lg">
                                <Play className="fill-primary text-primary ml-1" />
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[800px] p-0 bg-black border-none rounded-xl overflow-hidden">
                            <DialogTitle className="sr-only">
                              Vídeo de {exercise.name}
                            </DialogTitle>
                            <div className="aspect-video w-full">
                              <video
                                controls
                                playsInline
                                className="w-full h-full"
                                poster={workout.image}
                              >
                                <source
                                  src={exercise.videoUrl}
                                  type="video/mp4"
                                />
                              </video>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="p-6 flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold mb-2">
                          {exercise.name}
                        </h3>
                        {exercise.videoUrl && (
                          <Badge variant="secondary" className="gap-1">
                            <Video size={12} /> Vídeo
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                        <span className="bg-secondary/50 px-2 py-1 rounded-md">
                          {exercise.sets} Séries
                        </span>
                        <span className="bg-secondary/50 px-2 py-1 rounded-md">
                          {exercise.reps} Repetições
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {exercise.instructions}
                      </p>

                      {exercise.variations &&
                        exercise.variations.length > 0 && (
                          <div className="bg-secondary/20 p-3 rounded-lg">
                            <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                              <Repeat size={12} /> Variações
                            </p>
                            <ul className="space-y-1">
                              {exercise.variations.map((v, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex justify-between"
                                >
                                  <span>{v.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {v.sets} x {v.reps}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </section>
          <section>
            <CommentsSection workoutId={workout.id} />
          </section>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-ios-float">
            <CardContent className="p-6 space-y-6">
              {!hasAccess && isPaid ? (
                <>
                  {purchaseType === 'one_time' && workout.price ? (
                    <WorkoutPurchaseButton
                      workoutId={workout.id}
                      workoutTitle={workout.title}
                      price={workout.price}
                    />
                  ) : purchaseType === 'subscription' ? (
                    <Button
                      size="lg"
                      className="w-full text-lg h-14 rounded-xl shadow-lg"
                      onClick={() => navigate('/plans')}
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Assinar para Acessar
                    </Button>
                  ) : null}
                  <p className="text-xs text-center text-muted-foreground">
                    Você não tem acesso a este treino
                  </p>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/25"
                    onClick={handleStartWorkout}
                  >
                    <Play className="mr-2 fill-current" /> Começar Treino
                  </Button>
                  {user && user.role === 'subscriber' && (
                    <ProgressLogger
                      workoutId={workout.id}
                      workoutTitle={workout.title}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
