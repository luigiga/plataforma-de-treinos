import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { PaymentDialog } from '@/components/PaymentDialog'
import { useProducts } from '@/hooks/use-payments'
import { useReferral } from '@/hooks/use-referrals'
import { useNavigate } from 'react-router-dom'
import { Product } from '@/services/payments/products'

export default function SubscriptionPlans() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { referralTrainerId } = useReferral()

  // Buscar produtos de assinatura do banco
  const { data: products, isLoading } = useProducts({ type: 'subscription' })

  // Filtrar produtos por período (mensal ou anual)
  const filteredProducts = products?.filter((p) => {
    if (isAnnual) {
      return p.billing_period === 'year'
    }
    return p.billing_period === 'month'
  }) || []

  // Ordenar por preço
  const sortedProducts = [...filteredProducts].sort((a, b) => a.price - b.price)

  // Marcar o mais popular (meio termo de preço)
  const popularIndex = Math.floor(sortedProducts.length / 2)

  const handleSubscribeClick = (product: Product) => {
    if (!user) {
      navigate('/auth?tab=register')
      return
    }
    setSelectedProduct(product)
  }

  const handlePaymentSuccess = () => {
    setSelectedProduct(null)
    navigate('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Escolha seu Plano
        </h1>
        <p className="text-muted-foreground mb-8">
          Invista em você com preços acessíveis e flexíveis.
        </p>

        <div className="flex items-center justify-center gap-4">
          <span
            className={`text-sm ${!isAnnual ? 'font-bold' : 'text-muted-foreground'}`}
          >
            Mensal
          </span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span
            className={`text-sm ${isAnnual ? 'font-bold' : 'text-muted-foreground'}`}
          >
            Anual{' '}
            <span className="text-green-600 text-xs font-bold ml-1">
              -20% OFF
            </span>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum plano disponível no momento.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sortedProducts.map((product, index) => {
              const isPopular = index === popularIndex && sortedProducts.length >= 2
              const periodText = product.billing_period === 'year' ? 'ano' : 'mês'
              
              return (
                <Card
                  key={product.id}
                  className={`relative flex flex-col ${isPopular ? 'border-primary shadow-xl md:scale-105 z-10' : 'shadow-md'}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-white px-3 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <CardDescription>
                      {product.description || 'Plano de assinatura'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        R$ {Number(product.price).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-muted-foreground">/{periodText}</span>
                    </div>
                    {referralTrainerId && (
                      <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-300">
                          🎉 Você ganhou 10% de desconto através do link de referência!
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handleSubscribeClick(product)}
                    >
                      Assinar Agora
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {selectedProduct && (
            <PaymentDialog
              open={!!selectedProduct}
              onOpenChange={(open) => !open && setSelectedProduct(null)}
              productId={selectedProduct.id}
              planName={selectedProduct.name}
              price={Number(selectedProduct.price)}
              type="subscription"
              billingPeriod={selectedProduct.billing_period || 'month'}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </>
      )}
    </div>
  )
}
