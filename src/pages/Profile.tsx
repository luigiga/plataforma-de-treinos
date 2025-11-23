import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function Profile() {
  const { user, updateUser } = useAuth()

  if (!user)
    return (
      <div className="container py-20 text-center">
        Faça login para ver seu perfil.
      </div>
    )

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would gather form data here
    toast.success('Perfil atualizado com sucesso!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Configurações</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          {user.role === 'subscriber' && (
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          )}
          {user.role === 'trainer' && (
            <TabsTrigger value="trainer">Perfil Profissional</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seus dados de identificação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Alterar Foto</Button>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" defaultValue={user.name} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user.email} disabled />
                  </div>
                </div>
                <Button type="submit">Salvar Alterações</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie sua senha e segurança da conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Sua Assinatura</CardTitle>
              <CardDescription>
                Gerencie seu plano e pagamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold">Plano Premium</p>
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança: 25/12/2024
                  </p>
                </div>
                <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">
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
          <Card>
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
              <CardDescription>
                Como você aparece para os alunos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bio">Biografia</Label>
                <Input
                  id="bio"
                  defaultValue={user.bio}
                  placeholder="Conte um pouco sobre sua experiência..."
                />
              </div>
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
