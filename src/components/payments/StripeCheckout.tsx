import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
)

interface StripeCheckoutProps {
  clientSecret: string
  onSuccess: () => void
  onError?: (error: Error) => void
  amount: number
  description?: string
}

function CheckoutForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
  description,
}: StripeCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setMessage(error.message || 'Erro ao processar pagamento')
        onError?.(error as Error)
        toast.error(error.message || 'Erro ao processar pagamento')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Pagamento realizado com sucesso!')
        toast.success('Pagamento realizado com sucesso!')
        onSuccess()
      }
    } catch (err: any) {
      setMessage(err.message || 'Erro inesperado')
      onError?.(err)
      toast.error(err.message || 'Erro inesperado')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {message && (
        <div className="text-sm text-destructive mt-2">{message}</div>
      )}
      <div className="pt-4">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">
            R$ {amount.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
            </>
          ) : (
            `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`
          )}
        </Button>
      </div>
    </form>
  )
}

export function StripeCheckout({
  clientSecret,
  onSuccess,
  onError,
  amount,
  description,
}: StripeCheckoutProps) {
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    stripePromise.then(() => setStripeLoaded(true))
  }, [])

  if (!stripeLoaded || !clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <CheckoutForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        amount={amount}
        description={description}
      />
    </Elements>
  )
}

