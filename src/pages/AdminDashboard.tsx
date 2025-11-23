import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, User } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ShieldAlert,
  Trash2,
  Ban,
  CheckCircle,
  Search,
  Users,
  Activity,
  DollarSign,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
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

export default function AdminDashboard() {
  const { user, allUsers, deleteUser, toggleUserStatus } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth?tab=login')
    } else if (user.role !== 'admin') {
      toast.error('Acesso não autorizado.')
      navigate(user.role === 'trainer' ? '/trainer-dashboard' : '/dashboard')
    }
  }, [user, navigate])

  if (!user || user.role !== 'admin') return null

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id)
      setUserToDelete(null)
    }
  }

  const handleToggleConfirm = () => {
    if (userToToggle) {
      toggleUserStatus(userToToggle.id)
      setUserToToggle(null)
    }
  }

  const userGrowthData = [
    { name: 'Jan', users: 120 },
    { name: 'Fev', users: 150 },
    { name: 'Mar', users: 180 },
    { name: 'Abr', users: 220 },
    { name: 'Mai', users: 280 },
    { name: 'Jun', users: allUsers.length + 300 },
  ]

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-primary" /> Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e gestão de usuários.
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-10 w-full md:w-[300px] rounded-xl bg-secondary/30 border-transparent focus:bg-background focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinantes
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === 'subscriber').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trainers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === 'trainer').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Estimada
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.450</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2 border-none shadow-elevation">
          <CardHeader>
            <CardTitle>Crescimento da Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer
                config={{
                  users: { label: 'Usuários', color: 'hsl(var(--primary))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowthData}>
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
                    <Bar
                      dataKey="users"
                      fill="var(--color-users)"
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
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium">API Server</span>
              <Badge className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium">Database</span>
              <Badge className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium">Storage</span>
              <Badge className="bg-green-500">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-elevation overflow-hidden">
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Usuário</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-secondary/30">
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.role === 'admin'
                          ? 'border-primary text-primary'
                          : u.role === 'trainer'
                            ? 'border-blue-500 text-blue-500'
                            : ''
                      }
                    >
                      {u.role === 'admin'
                        ? 'Admin'
                        : u.role === 'trainer'
                          ? 'Trainer'
                          : 'Assinante'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === 'active' ? 'default' : 'secondary'}
                      className={
                        u.status === 'active'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-400 hover:bg-gray-500'
                      }
                    >
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {u.plan || 'Free'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {u.id !== user.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUserToToggle(u)}
                            title={
                              u.status === 'active' ? 'Desativar' : 'Ativar'
                            }
                          >
                            {u.status === 'active' ? (
                              <Ban className="h-4 w-4 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUserToDelete(u)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o usuário{' '}
              <span className="font-bold">{userToDelete?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!userToToggle}
        onOpenChange={(open) => !open && setUserToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.status === 'active'
                ? 'Desativar Usuário'
                : 'Ativar Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja{' '}
              {userToToggle?.status === 'active' ? 'desativar' : 'ativar'} o
              usuário <span className="font-bold">{userToToggle?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
