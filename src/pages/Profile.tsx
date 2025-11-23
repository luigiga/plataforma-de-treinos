import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Instagram,
  Twitter,
  Linkedin,
  Globe,
  Camera,
  Loader2,
} from 'lucide-react'
import { Gamification } from '@/components/Gamification'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username deve conter apenas letras, números e underline',
    ),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
})

const socialSchema = z.object({
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
})

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { following } = useData()
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      bio: '',
    },
  })

  const socialForm = useForm<z.infer<typeof socialSchema>>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      instagram: '',
      twitter: '',
      linkedin: '',
      website: '',
    },
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.username || '',
        full_name: user.full_name || '',
        bio: user.bio || '',
      })
      socialForm.reset({
        instagram: user.socialLinks?.instagram || '',
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || '',
        website: user.socialLinks?.website || '',
      })
      setAvatarPreview(user.avatar || null)
    }
  }, [user, profileForm, socialForm])

  if (!user)
    return (
      <div className="container py-20 text-center">
        Faça login para ver seu perfil.
      </div>
    )

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Selecione uma imagem para upload.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      setAvatarPreview(publicUrl)
      toast.success('Imagem carregada! Clique em Salvar para confirmar.')
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      const updates: any = {
        username: data.username,
        full_name: data.full_name,
        bio: data.bio,
      }

      if (avatarPreview && avatarPreview !== user.avatar) {
        updates.avatar = avatarPreview
      }

      const { error } = await updateUser(updates)
      if (error) throw error
    } catch (error: any) {
      console.error(error)
      // Error is already handled in updateUser with toast, but we can add specific handling here if needed
    }
  }

  const onSocialSubmit = async (data: z.infer<typeof socialSchema>) => {
    try {
      const { error } = await updateUser({
        socialLinks: data,
      })
      if (error) throw error
    } catch (error: any) {
      console.error(error)
    }
  }

  const followingCount = following.filter(
    (f) => f.followerId === user.id,
  ).length
  const followersCount = following.filter(
    (f) => f.followingId === user.id,
  ).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={avatarPreview || user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <div className="flex gap-8 text-sm bg-secondary/30 p-4 rounded-2xl w-full md:w-auto justify-center">
          <div className="text-center">
            <p className="font-bold text-2xl text-primary">{followingCount}</p>
            <p className="text-muted-foreground">Seguindo</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl text-primary">{followersCount}</p>
            <p className="text-muted-foreground">Seguidores</p>
          </div>
        </div>
      </div>

      {user.role === 'subscriber' && (
        <div className="mb-8">
          <Gamification />
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-secondary/30 p-1 rounded-xl h-auto">
          <TabsTrigger value="profile" className="rounded-lg">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-lg">
            Social
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg">
            Conta
          </TabsTrigger>
          {user.role === 'subscriber' && (
            <TabsTrigger value="subscription" className="rounded-lg">
              Assinatura
            </TabsTrigger>
          )}
          {user.role === 'trainer' && (
            <TabsTrigger value="trainer" className="rounded-lg">
              Profissional
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-none shadow-elevation">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Personalize como você aparece na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="seu_username" {...field} />
                          </FormControl>
                          <FormDescription>
                            Este é seu identificador único na plataforma.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu Nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biografia</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Conte um pouco sobre você..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={profileForm.formState.isSubmitting || uploading}
                  >
                    {profileForm.formState.isSubmitting
                      ? 'Salvando...'
                      : 'Salvar Alterações'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="border-none shadow-elevation">
            <CardHeader>
              <CardTitle>Redes Sociais</CardTitle>
              <CardDescription>
                Conecte suas redes para que outros possam te encontrar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...socialForm}>
                <form
                  onSubmit={socialForm.handleSubmit(onSocialSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={socialForm.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram size={16} /> Instagram
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Twitter size={16} /> Twitter
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Linkedin size={16} /> LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="URL do perfil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe size={16} /> Website
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={socialForm.formState.isSubmitting}
                  >
                    {socialForm.formState.isSubmitting
                      ? 'Salvando...'
                      : 'Salvar Redes Sociais'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="border-none shadow-elevation">
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Gerencie sua senha e acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>
              <Button className="w-full md:w-auto">Atualizar Senha</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="border-none shadow-elevation">
            <CardHeader>
              <CardTitle>Sua Assinatura</CardTitle>
              <CardDescription>
                Gerencie seu plano e pagamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-bold text-lg text-primary">
                    Plano Premium
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança: 25/12/2024
                  </p>
                </div>
                <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                  Ativo
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="w-full sm:w-auto">
                  Gerenciar Pagamento
                </Button>
                <Button variant="destructive" className="w-full sm:w-auto">
                  Cancelar Assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainer">
          <Card className="border-none shadow-elevation">
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
              <CardDescription>
                Informações visíveis para seus alunos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="specialties">Especialidades</Label>
                <Input
                  id="specialties"
                  placeholder="Ex: Hipertrofia, Yoga, Funcional"
                />
              </div>
              <Button className="w-full md:w-auto">
                Salvar Perfil Profissional
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
