import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Dumbbell, TrendingUp, DollarSign } from 'lucide-react'
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
  AreaChart,
  Area,
} from 'recharts'

interface TrainerOverviewProps {
  totalWorkouts: number
  totalClients: number
}

export function TrainerOverview({
  totalWorkouts,
  totalClients,
}: TrainerOverviewProps) {
  const revenueData = [
    { name: 'Jan', revenue: 2000 },
    { name: 'Fev', revenue: 2500 },
    { name: 'Mar', revenue: 3000 },
    { name: 'Abr', revenue: 2800 },
    { name: 'Mai', revenue: 3500 },
    { name: 'Jun', revenue: 4500 },
  ]

  const clientGrowthData = [
    { name: 'Jan', clients: 10 },
    { name: 'Fev', clients: 12 },
    { name: 'Mar', clients: 15 },
    { name: 'Abr', clients: 18 },
    { name: 'Mai', clients: 22 },
    { name: 'Jun', clients: totalClients },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Treinos
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-green-500 font-medium">+12% este mês</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 4.500,00</div>
            <p className="text-xs text-green-500 font-medium">+5% este mês</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Taxa de conclusão</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-elevation">
          <CardHeader>
            <CardTitle>Receita Semestral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer
                config={{
                  revenue: {
                    label: 'Receita (R$)',
                    color: 'hsl(var(--primary))',
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
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
            <CardTitle>Crescimento de Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer
                config={{
                  clients: { label: 'Alunos', color: 'hsl(var(--chart-2))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={clientGrowthData}>
                    <defs>
                      <linearGradient
                        id="colorClients"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-clients)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-clients)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="clients"
                      stroke="var(--color-clients)"
                      fillOpacity={1}
                      fill="url(#colorClients)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
