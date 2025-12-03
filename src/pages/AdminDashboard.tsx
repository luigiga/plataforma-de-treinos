import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, User } from '@/context/AuthContext'
import { profileService } from '@/services/profile'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/PaginationControls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'
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
  const { user, deleteUser, toggleUserStatus } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const pageSize = 20

  // Função para mapear profile para User
  const mapProfileToUser = (profile: any): User => ({
    id: profile.id,
    name: profile.full_name || profile.username || 'Usuário',
    email: profile.email || '',
    avatar: profile.avatar_url || '',
    role: (profile.role as 'subscriber' | 'trainer' | 'admin') || 'subscriber',
    username: profile.username || '',
    bio: profile.bio || '',
    status: profile.status || 'active',
    socialLinks: profile.metadata?.socialLinks,
    preferences: profile.metadata?.preferences,
    notificationPreferences: profile.metadata?.notificationPreferences,
    subscriptionStatus: profile.metadata?.subscriptionStatus,
    plan: profile.metadata?.plan,
    points: profile.metadata?.points || 0,
    badges: profile.metadata?.badges || [],
  })

  // Carregar usuários com paginação e filtros
  useEffect(() => {
    const loadUsers = async () => {
      if (!user || user.role !== 'admin') return

      setLoadingUsers(true)
      try {
        const result = await profileService.getAllProfilesPaginated({
          page: currentPage,
          pageSize,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
        })

        setUsers(result.data.map(mapProfileToUser))
        setTotalUsers(result.total)
      } catch (error) {
        toast.error('Erro ao carregar usuários')
        logger.error('Error loading users', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [user, currentPage, roleFilter, statusFilter, searchTerm])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  // Removido verificação manual - ProtectedRoute já faz isso
  if (!user || user.role !== 'admin') return null

  const totalPages = Math.ceil(totalUsers / pageSize)

  // Estatísticas - buscar totais separadamente para não depender da página atual
  const [stats, setStats] = useState({
    total: 0,
    subscribers: 0,
    trainers: 0,
    admins: 0,
    active: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      if (!user || user.role !== 'admin') return

      try {
        // Buscar totais por role e status
        const [allResult, subscribersResult, trainersResult, adminsResult, activeResult] = await Promise.all([
          profileService.getAllProfilesPaginated({ page: 1, pageSize: 1 }),
          profileService.getAllProfilesPaginated({ page: 1, pageSize: 1, role: 'subscriber' }),
          profileService.getAllProfilesPaginated({ page: 1, pageSize: 1, role: 'trainer' }),
          profileService.getAllProfilesPaginated({ page: 1, pageSize: 1, role: 'admin' }),
          profileService.getAllProfilesPaginated({ page: 1, pageSize: 1, status: 'active' }),
        ])

        setStats({
          total: allResult.total,
          subscribers: subscribersResult.total,
          trainers: trainersResult.total,
          admins: adminsResult.total,
          active: activeResult.total,
        })
      } catch (error) {
        logger.error('Error loading stats', error)
      }
    }

    loadStats()
  }, [user])

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
    { name: 'Jun', users: totalUsers + 300 },
  ]

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-primary" /> Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e gestão de usuários.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-10 w-full sm:w-[250px] rounded-xl bg-secondary/30 border-transparent focus:bg-background focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Roles</SelectItem>
              <SelectItem value="subscriber">Assinantes</SelectItem>
              <SelectItem value="trainer">Trainers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de usuários
            </p>
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
            <div className="text-2xl font-bold">{stats.subscribers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.subscribers / stats.total) * 100) : 0}% do total
            </p>
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
            <div className="text-2xl font-bold">{stats.trainers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.trainers / stats.total) * 100) : 0}% do total
            </p>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[200px]">Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando usuários...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-secondary/30">
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
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
                        variant={
                          u.status === 'active' ? 'default' : 'secondary'
                        }
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
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
