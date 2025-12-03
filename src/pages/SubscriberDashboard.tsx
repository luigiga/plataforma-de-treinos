import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { useWorkouts } from '@/hooks/use-workouts'
import { OptimizedImage } from '@/components/OptimizedImage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/PaginationControls'
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
import { Gamification } from '@/components/Gamification'
import { CalendarSync } from '@/components/CalendarSync'

export default function SubscriberDashboard() {
  const { user } = useAuth()
  const { workouts: allWorkouts } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Usar hook otimizado com paginação
  const { data: workoutsData, isLoading } = useWorkouts({
    page: currentPage,
    pageSize,
  })

  const workouts = workoutsData?.data || []
  const totalWorkouts = workoutsData?.total || 0
  const totalPages = Math.ceil(totalWorkouts / pageSize)

  // ProtectedRoute já garante que user existe e tem role 'subscriber'
  if (!user) return null

  const recommendedWorkouts = allWorkouts
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

  // Resetar para página 1 quando filtros mudarem
  const handleFilterChange = (newFilter: string) => {
    setCategoryFilter(newFilter)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }


  const categories = [
    'Todos',
    'Força',
    'Cardio',
    'Yoga',
    'Hipertrofia',
    'Flexibilidade',
  ]

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Olá, {user?.name}!</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Pronto para o treino de hoje?
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
          <CalendarSync label="Sincronizar Agenda" />
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto shadow-sm"
          >
            <Link to="/progress">
              <TrendingUp className="mr-2 h-4 w-4" /> Meu Progresso
            </Link>
          </Button>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar treinos..."
              className="pl-10 w-full sm:w-[300px] rounded-xl bg-secondary/30 border-transparent focus:bg-background focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
        <div className="lg:col-span-3">
          {recommendedWorkouts.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg md:text-xl font-bold">
                  Recomendado para Você
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {recommendedWorkouts.map((workout) => (
                  <Link key={`rec-${workout.id}`} to={`/workout/${workout.id}`}>
                    <Card className="h-full border-none bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-300 shadow-sm hover:shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {workout.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {workout.category.map((c) => (
                            <Badge
                              key={c}
                              variant="secondary"
                              className="text-[10px] bg-white/50 dark:bg-black/50"
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
            onValueChange={handleFilterChange}
          >
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent gap-2 no-scrollbar touch-pan-x">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="px-4 py-2 rounded-full whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border bg-background shadow-sm flex-shrink-0"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredWorkouts.map((workout, index) => (
              <Link key={workout.id} to={`/workout/${workout.id}`}>
                <Card
                  className="h-full border-none shadow-elevation hover:shadow-glass transition-all duration-300 hover:-translate-y-1 overflow-hidden group rounded-2xl bg-card"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <OptimizedImage
                      src={workout.image}
                      alt={workout.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      lazy={true}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="backdrop-blur-md bg-white/80 dark:bg-black/60 shadow-sm"
                      >
                        {workout.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg md:text-xl">
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
                          className="text-xs rounded-md border-primary/20 text-primary bg-primary/5"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground flex gap-4 pt-0 pb-6">
                    <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                      <Clock size={14} /> {workout.duration} min
                    </div>
                    <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                      <BarChart size={14} /> {workout.exercises.length}{' '}
                      exercícios
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Carregando treinos...
            </div>
          )}
          {!isLoading && filteredWorkouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum treino encontrado.
            </div>
          )}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-8"
          />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Gamification />
          </div>
        </div>
      </div>
    </div>
  )
}
