import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Clock,
  BarChart,
  User,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SubscriberDashboard() {
  const { user } = useAuth()
  const { workouts } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')

  if (!user || user.role !== 'subscriber') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-8">
          Esta página é exclusiva para Assinantes.
        </p>
        <Button asChild>
          <Link to="/auth?tab=login">Fazer Login</Link>
        </Button>
      </div>
    )
  }

  // Recommendation Logic
  const recommendedWorkouts = workouts
    .filter(
      (w) =>
        user.preferences?.some((pref) => w.category.includes(pref)) &&
        w.status === 'published',
    )
    .slice(0, 3)

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch =
      workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.trainerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === 'Todos' || workout.category.includes(categoryFilter)
    return matchesSearch && matchesCategory && workout.status === 'published'
  })

  const categories = [
    'Todos',
    'Força',
    'Cardio',
    'Yoga',
    'Hipertrofia',
    'Flexibilidade',
  ]

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.name}!</h1>
          <p className="text-muted-foreground">Pronto para o treino de hoje?</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" asChild className="hidden md:flex">
            <Link to="/progress">
              <TrendingUp className="mr-2 h-4 w-4" /> Meu Progresso
            </Link>
          </Button>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar treinos..."
              className="pl-10 w-full md:w-[300px] rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendedWorkouts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-500 fill-yellow-500" />
            <h2 className="text-xl font-bold">Recomendado para Você</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendedWorkouts.map((workout) => (
              <Link key={`rec-${workout.id}`} to={`/workout/${workout.id}`}>
                <Card className="h-full border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{workout.title}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      {workout.category.map((c) => (
                        <Badge
                          key={c}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workout.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Tabs
        defaultValue="Todos"
        className="mb-8"
        onValueChange={setCategoryFilter}
      >
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent gap-2">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="px-4 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border bg-background"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkouts.map((workout, index) => (
          <Link key={workout.id} to={`/workout/${workout.id}`}>
            <Card
              className="h-full border-none shadow-elevation hover:shadow-ios-float transition-all duration-300 hover:-translate-y-1 overflow-hidden group rounded-2xl"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={workout.image}
                  alt={workout.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="secondary"
                    className="backdrop-blur-md bg-white/80 dark:bg-black/60"
                  >
                    {workout.difficulty}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-xl">
                  {workout.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={14} />
                  <span>{workout.trainerName}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {workout.category.map((cat) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className="text-xs rounded-md"
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground flex gap-4 pt-0 pb-6">
                <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                  <Clock size={14} />
                  {workout.duration} min
                </div>
                <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                  <BarChart size={14} />
                  {workout.exercises.length} exercícios
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
