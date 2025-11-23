import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Video, Upload, X, Plus } from 'lucide-react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'

interface ExerciseFormItemProps {
  form: UseFormReturn<any>
  index: number
  remove: (index: number) => void
}

export function ExerciseFormItem({
  form,
  index,
  remove,
}: ExerciseFormItemProps) {
  const {
    fields: variations,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({
    control: form.control,
    name: `exercises.${index}.variations`,
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Arquivo inválido.')
      return
    }
    const url = URL.createObjectURL(file)
    form.setValue(`exercises.${index}.videoUrl`, url)
    toast.success('Vídeo carregado!')
  }

  return (
    <Card className="shadow-sm border border-border/50 animate-scale-up mb-4">
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
                  <Textarea placeholder="Dicas..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Video Upload Section */}
          <FormField
            control={form.control}
            name={`exercises.${index}.videoUrl`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Video size={14} /> Vídeo
                </FormLabel>
                <div className="flex gap-2 items-center">
                  <FormControl>
                    <Input placeholder="URL do vídeo" {...field} />
                  </FormControl>
                  <Input
                    type="file"
                    className="hidden"
                    id={`video-${index}`}
                    accept="video/*"
                    onChange={handleFileUpload}
                  />
                  <Button type="button" variant="outline" size="icon" asChild>
                    <label htmlFor={`video-${index}`}>
                      <Upload className="h-4 w-4" />
                    </label>
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Variations Section */}
          <div className="bg-secondary/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold">Variações (Avançado)</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  appendVariation({ name: '', sets: '', reps: '' })
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {variations.map((v, vIndex) => (
              <div key={v.id} className="flex gap-2 mb-2 items-end">
                <FormField
                  control={form.control}
                  name={`exercises.${index}.variations.${vIndex}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`exercises.${index}.variations.${vIndex}.sets`}
                  render={({ field }) => (
                    <FormItem className="w-16">
                      <FormControl>
                        <Input placeholder="S" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`exercises.${index}.variations.${vIndex}.reps`}
                  render={({ field }) => (
                    <FormItem className="w-16">
                      <FormControl>
                        <Input placeholder="R" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariation(vIndex)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
