import { useState } from 'react'
import { useTransactions } from '@/hooks/use-payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaginationControls } from '@/components/PaginationControls'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PaymentHistory() {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const { data, isLoading } = useTransactions(currentPage, pageSize)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Você ainda não realizou nenhum pagamento.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      succeeded: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    }

    const labels: Record<string, string> = {
      succeeded: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
      refunded: 'Reembolsado',
      partially_refunded: 'Parcialmente Reembolsado',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.data.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {transaction.type === 'subscription' ? 'Assinatura' : 'Treino Avulso'}
                  </span>
                  {getStatusBadge(transaction.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.created_at), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  R$ {Number(transaction.amount).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Líquido: R$ {Number(transaction.net_amount).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {data.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={data.totalPages}
            onPageChange={setCurrentPage}
            className="mt-6"
          />
        )}
      </CardContent>
    </Card>
  )
}

