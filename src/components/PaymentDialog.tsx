import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  price: number
  onSuccess: () => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  planName,
  price,
  onSuccess,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setLoading(false)
    onOpenChange(false)
    onSuccess()
    toast.success('Pagamento processado com sucesso!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagamento Seguro</DialogTitle>
          <DialogDescription>
            Assinando plano {planName} por R$ {price.toFixed(2)}/mês
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handlePayment} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="card">Número do Cartão</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="card"
                placeholder="0000 0000 0000 0000"
                className="pl-10"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={19}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Validade</Label>
              <Input
                id="expiry"
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                maxLength={5}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvc">CVC</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="cvc"
                  placeholder="123"
                  className="pl-8"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={3}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
