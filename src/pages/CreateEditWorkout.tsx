import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ArrowLeft } from 'lucide-react'
import { ExerciseFormItem } from '@/components/ExerciseFormItem'

const variationSchema = z.object({
  name: z.string(),
  sets: z.string(),
  reps: z.string(),
})

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  sets: z.string().min(1, 'Séries obrigatórias'),
  reps: z.string().min(1, 'Repetições obrigatórias'),
  instructions: z.string(),
  videoUrl: z.string().optional(),
  variations: z.array(variationSchema).optional(),
})

const workoutSchema = z.object({
  title: z.string().min(3, 'Título curto'),
  description: z.string().min(10, 'Descrição curta'),
  image: z.string().url('URL inválida').or(z.literal('')),
  duration: z.coerce.number().min(1),
  difficulty: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
  isCircuit: z.boolean().default(false),
  exercises: z.array(exerciseSchema).min(1, 'Adicione exercícios'),
})

export default function CreateEditWorkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addWorkout, updateWorkout, workouts } = useData()
  const { user } = useAuth()
  const isEditing = !!id
  const existingWorkout = workouts.find((w) => w.id === id)

  const form = useForm<z.infer<typeof workoutSchema>>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      title: '',
      description: '',
      image: 'https://img.usecurling.com/p/800/600?q=gym',
      duration: 30,
      difficulty: 'Iniciante',
      isCircuit: false,
      exercises: [
        {
          name: '',
          sets: '',
          reps: '',
          instructions: '',
          videoUrl: '',
          variations: [],
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  })

  useEffect(() => {
    if (isEditing && existingWorkout) {
      form.reset({
        ...existingWorkout,
        exercises: existingWorkout.exercises.map((e) => ({
          ...e,
          videoUrl: e.videoUrl || '',
          variations: e.variations || [],
        })),
      })
    }
  }, [isEditing, existingWorkout, form])

  const onSubmit = (data: z.infer<typeof workoutSchema>) => {
    const workoutData = {
      ...data,
      trainerId: user?.id || '101',
      category: ['Geral'],
      status: 'published' as const,
      exercises: data.exercises.map((e, i) => ({ ...e, id: `new-${i}` })),
    }
    isEditing && id ? updateWorkout(id, workoutData) : addWorkout(workoutData)
    navigate('/trainer-dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
      <Button
        variant="ghost"
        className="mb-4 pl-0"
        onClick={() => navigate('/trainer-dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <h1 className="text-3xl font-bold mb-8">
        {isEditing ? 'Editar Treino' : 'Criar Novo Treino'}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dificuldade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="Intermediário">
                            Intermediário
                          </SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isCircuit"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Modo Circuito</FormLabel>
                      <FormDescription>
                        Exercícios sem descanso entre eles.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Exercícios</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: '',
                    sets: '',
                    reps: '',
                    instructions: '',
                    videoUrl: '',
                    variations: [],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </div>
            {fields.map((field, index) => (
              <ExerciseFormItem
                key={field.id}
                form={form}
                index={index}
                remove={remove}
              />
            ))}
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/trainer-dashboard')}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar Treino</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
