import { useState } from 'react'
import { useProductByWorkout, useCreatePaymentIntent } from '@/hooks/use-payments'
import { useReferral } from '@/hooks/use-referrals'
import { Button } from '@/components/ui/button'
import { PaymentDialog } from '@/components/PaymentDialog'
import { Loader2, Lock, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface WorkoutPurchaseButtonProps {
  workoutId: string
  workoutTitle: string
  price: number
}

export function WorkoutPurchaseButton({
  workoutId,
  workoutTitle,
  price,
}: WorkoutPurchaseButtonProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { referralTrainerId } = useReferral()
  const { data: product, isLoading } = useProductByWorkout(workoutId)
  const createPaymentIntent = useCreatePaymentIntent()

  const handlePurchaseClick = () => {
    if (!user) {
      toast.error('Você precisa estar logado para comprar este treino')
      navigate('/auth?tab=login')
      return
    }

    if (!product) {
      toast.error('Produto não encontrado. Entre em contato com o suporte.')
      return
    }

    setShowPaymentDialog(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false)
    toast.success('Treino comprado com sucesso! Agora você tem acesso completo.')
    // Recarregar a página para atualizar o acesso
    window.location.reload()
  }

  if (isLoading) {
    return (
      <Button size="lg" className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    )
  }

  if (!product) {
    return null // Não mostrar botão se não houver produto
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full text-lg h-14 rounded-xl shadow-lg"
        onClick={handlePurchaseClick}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Comprar por R$ {price.toFixed(2).replace('.', ',')}
      </Button>

      {showPaymentDialog && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          productId={product.id}
          planName={workoutTitle}
          price={price}
          type="one_time"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  )
}

