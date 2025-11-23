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
  LineChart,
  Line,
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
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Meu Progresso</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Treinos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWorkouts}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Total
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalTime}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                min
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Treino
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {logs.length > 0
                ? format(parseISO(logs[0].date), 'dd/MM', { locale: ptBR })
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-elevation">
          <CardHeader>
            <CardTitle>Duração dos Treinos (min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] md:h-[300px] w-full">
              <ChartContainer
                config={{
                  duration: { label: 'Duração', color: 'hsl(var(--primary))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
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

        <Card className="border-none shadow-elevation">
          <CardHeader>
            <CardTitle>Consistência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] md:h-[300px] w-full">
              <ChartContainer
                config={{
                  duration: { label: 'Minutos', color: 'hsl(var(--chart-2))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="var(--color-duration)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
