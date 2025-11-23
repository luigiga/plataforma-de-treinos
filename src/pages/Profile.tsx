import { useState } from 'react'
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
import { toast } from 'sonner'
import { Instagram, Twitter, Linkedin, Globe } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { following } = useData()
  const [bio, setBio] = useState(user?.bio || '')
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram || '')
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || '')
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '')
  const [website, setWebsite] = useState(user?.socialLinks?.website || '')

  if (!user)
    return (
      <div className="container py-20 text-center">
        Faça login para ver seu perfil.
      </div>
    )

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser({
      bio,
      socialLinks: { instagram, twitter, linkedin, website },
    })
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
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-white text-xs font-bold">Alterar</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-8 text-sm bg-secondary/30 p-4 rounded-2xl">
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

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-secondary/30 p-1 rounded-xl">
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
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" defaultValue={user.name} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <Button type="submit">Salvar Alterações</Button>
              </form>
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
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Instagram size={16} /> Instagram
                  </Label>
                  <Input
                    placeholder="@usuario"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Twitter size={16} /> Twitter
                  </Label>
                  <Input
                    placeholder="@usuario"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Linkedin size={16} /> LinkedIn
                  </Label>
                  <Input
                    placeholder="URL do perfil"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Globe size={16} /> Website
                  </Label>
                  <Input
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <Button type="submit">Salvar Redes Sociais</Button>
              </form>
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
              <Button>Atualizar Senha</Button>
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
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex justify-between items-center">
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
              <div className="flex gap-4">
                <Button variant="outline">Gerenciar Pagamento</Button>
                <Button variant="destructive">Cancelar Assinatura</Button>
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
              <Button>Salvar Perfil Profissional</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
