import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, ArrowLeft } from 'lucide-react'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome do exercício é obrigatório'),
  sets: z.string().min(1, 'Séries obrigatórias'),
  reps: z.string().min(1, 'Repetições obrigatórias'),
  instructions: z.string(),
})

const workoutSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  description: z.string().min(10, 'Descrição muito curta'),
  image: z.string().url('URL de imagem inválida').or(z.literal('')),
  duration: z.coerce.number().min(1, 'Duração inválida'),
  difficulty: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
  exercises: z.array(exerciseSchema).min(1, 'Adicione pelo menos um exercício'),
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
      exercises: [{ name: '', sets: '', reps: '', instructions: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  })

  useEffect(() => {
    if (isEditing && existingWorkout) {
      form.reset({
        title: existingWorkout.title,
        description: existingWorkout.description,
        image: existingWorkout.image,
        duration: existingWorkout.duration,
        difficulty: existingWorkout.difficulty,
        exercises: existingWorkout.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          instructions: e.instructions,
        })),
      })
    }
  }, [isEditing, existingWorkout, form])

  const onSubmit = (data: z.infer<typeof workoutSchema>) => {
    const workoutData = {
      ...data,
      trainerId: user?.id || '101', // Mock ID
      category: ['Geral'], // Mock category
      status: 'published' as const,
      exercises: data.exercises.map((e, i) => ({ ...e, id: `new-${i}` })),
    }

    if (isEditing && id) {
      updateWorkout(id, workoutData)
    } else {
      addWorkout(workoutData)
    }
    navigate('/trainer-dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
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
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Treino</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Treino de Pernas Intenso"
                        {...field}
                      />
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
                      <Textarea
                        placeholder="Descreva o objetivo e detalhes do treino..."
                        {...field}
                      />
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
                            <SelectValue placeholder="Selecione" />
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
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem de Capa</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
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
                  append({ name: '', sets: '', reps: '', instructions: '' })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Exercício
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Exercício</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Agachamento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`exercises.${index}.sets`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Séries</FormLabel>
                            <FormControl>
                              <Input placeholder="3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`exercises.${index}.reps`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repetições</FormLabel>
                            <FormControl>
                              <Input placeholder="12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.instructions`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instruções</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Dicas de execução..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
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
