import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublicUser } from '@/context/DataContext'
import { Eye } from 'lucide-react'

interface TrainerClientsProps {
  clients: PublicUser[]
}

export function TrainerClients({ clients }: TrainerClientsProps) {
  return (
    <div className="rounded-md border animate-fade-in overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Aluno</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.bio || 'Sem biografia'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-green-600 bg-green-50"
                    >
                      Ativo
                    </Badge>
                  </TableCell>
                  <TableCell>Premium</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/trainer/client/${client.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Detalhes
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Você ainda não tem alunos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
