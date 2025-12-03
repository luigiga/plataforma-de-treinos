import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StripeCheckout } from '@/components/payments/StripeCheckout'
import { useCreateSubscription, useCreatePaymentIntent } from '@/hooks/use-payments'
import { useReferral } from '@/hooks/use-referrals'
import { Loader2 } from 'lucide-react'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  planName: string
  price: number
  type: 'subscription' | 'one_time'
  billingPeriod?: 'month' | 'year'
  onSuccess: () => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  productId,
  planName,
  price,
  type,
  billingPeriod,
  onSuccess,
}: PaymentDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { referralTrainerId } = useReferral()
  const createSubscription = useCreateSubscription()
  const createPaymentIntent = useCreatePaymentIntent()

  useEffect(() => {
    if (open && productId) {
      createClientSecret()
    } else {
      setClientSecret(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId])

  const createClientSecret = async () => {
    setIsLoading(true)
    try {
      if (type === 'subscription') {
        const result = await createSubscription.mutateAsync({
          productId,
          referralTrainerId: referralTrainerId || undefined,
        })
        setClientSecret(result.clientSecret)
      } else {
        const result = await createPaymentIntent.mutateAsync({
          productId,
          amount: price,
          referralTrainerId: referralTrainerId || undefined,
        })
        setClientSecret(result.clientSecret)
      }
    } catch (error) {
      console.error('Error creating payment', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
    setClientSecret(null)
  }

  const periodText = billingPeriod === 'year' ? 'ano' : 'mês'
  const description =
    type === 'subscription'
      ? `Assinando plano ${planName} por R$ ${price.toFixed(2)}/${periodText}`
      : `Comprando ${planName} por R$ ${price.toFixed(2)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagamento Seguro</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : clientSecret ? (
            <StripeCheckout
              clientSecret={clientSecret}
              amount={price}
              description={description}
              onSuccess={handleSuccess}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Erro ao inicializar pagamento. Tente novamente.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
