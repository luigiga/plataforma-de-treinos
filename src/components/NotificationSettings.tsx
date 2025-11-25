import { useAuth } from '@/context/AuthContext'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, MessageSquare, UserPlus, Dumbbell, Info } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationSettings() {
  const { user, updateUser } = useAuth()

  if (!user) return null

  const preferences = user.notificationPreferences || {
    newFollower: true,
    newMessage: true,
    workoutAssignment: true,
    systemUpdates: true,
  }

  const handleToggle = async (key: keyof typeof preferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] }
    const { error } = await updateUser({
      notificationPreferences: newPreferences,
    })

    if (!error) {
      toast.success('Preferências atualizadas.')
    }
  }

  return (
    <Card className="border-none shadow-elevation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> Configurações de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <UserPlus size={18} />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="new-follower">Novos Seguidores</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas quando alguém começar a te seguir.
              </p>
            </div>
          </div>
          <Switch
            id="new-follower"
            checked={preferences.newFollower}
            onCheckedChange={() => handleToggle('newFollower')}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <MessageSquare size={18} />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="new-message">Novas Mensagens</Label>
              <p className="text-sm text-muted-foreground">
                Seja notificado quando receber uma mensagem direta.
              </p>
            </div>
          </div>
          <Switch
            id="new-message"
            checked={preferences.newMessage}
            onCheckedChange={() => handleToggle('newMessage')}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <Dumbbell size={18} />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="workout-assignment">Atribuição de Treinos</Label>
              <p className="text-sm text-muted-foreground">
                Saiba quando seu treinador enviar um novo treino.
              </p>
            </div>
          </div>
          <Switch
            id="workout-assignment"
            checked={preferences.workoutAssignment}
            onCheckedChange={() => handleToggle('workoutAssignment')}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <Info size={18} />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="system-updates">Atualizações do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Novidades, manutenções e avisos importantes.
              </p>
            </div>
          </div>
          <Switch
            id="system-updates"
            checked={preferences.systemUpdates}
            onCheckedChange={() => handleToggle('systemUpdates')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
