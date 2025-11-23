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
import { Search, Clock, BarChart, User } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SubscriberDashboard() {
  const { user } = useAuth()
  const { workouts } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.name}!</h1>
          <p className="text-muted-foreground">Pronto para o treino de hoje?</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar treinos ou trainers..."
            className="pl-10 w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        defaultValue="Todos"
        className="mb-8"
        onValueChange={setCategoryFilter}
      >
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="px-4 py-2">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkouts.map((workout) => (
          <Link key={workout.id} to={`/workout/${workout.id}`}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={workout.image}
                  alt={workout.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="secondary"
                    className="backdrop-blur-md bg-white/80"
                  >
                    {workout.difficulty}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{workout.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={14} />
                  <span>{workout.trainerName}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {workout.category.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground flex gap-4 pt-0">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {workout.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <BarChart size={14} />
                  {workout.exercises.length} exercícios
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {filteredWorkouts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">
            Nenhum treino encontrado com esses filtros.
          </p>
        </div>
      )}
    </div>
  )
}
