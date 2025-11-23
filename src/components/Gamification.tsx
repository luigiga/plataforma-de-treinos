import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Medal, Star, Award } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function Gamification() {
  const { user } = useAuth()

  if (!user || user.role !== 'subscriber') return null

  const points = user.points || 0
  const level = Math.floor(points / 100) + 1
  const nextLevelPoints = level * 100
  const progress = ((points % 100) / 100) * 100

  const badges = [
    {
      id: 'beginner',
      name: 'Iniciante',
      icon: Star,
      color: 'text-blue-500',
      desc: 'Criou uma conta',
      earned: true,
    },
    {
      id: 'focused',
      name: 'Focado',
      icon: Medal,
      color: 'text-yellow-500',
      desc: 'Completou 5 treinos',
      earned: (user.badges || []).includes('focused'),
    },
    {
      id: 'master',
      name: 'Mestre',
      icon: Trophy,
      color: 'text-purple-500',
      desc: 'Alcançou 1000 pontos',
      earned: points >= 1000,
    },
    {
      id: 'social',
      name: 'Social',
      icon: Award,
      color: 'text-green-500',
      desc: 'Fez 5 avaliações',
      earned: (user.badges || []).includes('social'),
    },
  ]

  return (
    <Card className="border-none shadow-elevation bg-gradient-to-br from-background to-secondary/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="text-primary h-5 w-5" />
            Nível {level}
          </CardTitle>
          <span className="text-sm font-bold text-primary">{points} XP</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>
                {points} / {nextLevelPoints}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold mb-3 text-muted-foreground">
              Conquistas
            </p>
            <div className="flex gap-3">
              <TooltipProvider>
                {badges.map((badge) => (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger>
                      <div
                        className={`p-2 rounded-full border-2 transition-all ${
                          badge.earned
                            ? `bg-secondary/50 border-primary/20 ${badge.color}`
                            : 'bg-muted border-transparent text-muted-foreground opacity-40 grayscale'
                        }`}
                      >
                        <badge.icon size={20} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{badge.name}</p>
                      <p className="text-xs">{badge.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
