import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Calendar, Clock, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ProgressHistory() {
  const { user } = useAuth()
  const { getUserProgress } = useData()

  if (!user) return null

  const logs = getUserProgress(user.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // Prepare chart data (last 7 days duration)
  const chartData = logs
    .slice(0, 7)
    .reverse()
    .map((log) => ({
      date: format(parseISO(log.date), 'dd/MM', { locale: ptBR }),
      duration: log.duration,
    }))

  const totalWorkouts = logs.length
  const totalTime = logs.reduce((acc, log) => acc + log.duration, 0)

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Meu Progresso</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Treinos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Total
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTime} min</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Treino
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0
                ? format(parseISO(logs[0].date), 'dd/MM', { locale: ptBR })
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-elevation border-none">
          <CardHeader>
            <CardTitle>Duração dos Treinos (min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer
                config={{
                  duration: {
                    label: 'Duração',
                    color: 'hsl(var(--primary))',
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="duration"
                      fill="var(--color-duration)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevation border-none">
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{log.workoutTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(log.date), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">
                      {log.duration} min
                    </span>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum treino registrado ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
