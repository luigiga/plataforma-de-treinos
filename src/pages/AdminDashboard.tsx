import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { ShieldAlert, Trash2, Ban, CheckCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function AdminDashboard() {
  const { user, allUsers, deleteUser, toggleUserStatus } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-muted-foreground mb-8">
          Você não tem permissão para acessar esta página.
        </p>
        <Button asChild>
          <Link to="/">Voltar para Home</Link>
        </Button>
      </div>
    )
  }

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

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-primary" /> Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões do sistema.
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-10 w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === 'subscriber').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === 'trainer').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Usuários Registrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o usuário{' '}
              <span className="font-bold">{userToDelete?.name}</span>? Esta ação
              não pode ser desfeita e todos os dados associados serão perdidos.
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

      {/* Toggle Status Confirmation Dialog */}
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
              {userToToggle?.status === 'active' &&
                ' O usuário não poderá mais fazer login no sistema.'}
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
