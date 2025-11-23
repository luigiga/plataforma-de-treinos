import { useState } from 'react'
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
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function SubscriptionPlans() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: 'Básico',
      price: isAnnual ? 19.9 : 29.9,
      description: 'Para quem está começando.',
      features: ['Acesso a 5 treinos/mês', 'Suporte básico', 'Sem anúncios'],
      popular: false,
    },
    {
      name: 'Premium',
      price: isAnnual ? 39.9 : 49.9,
      description: 'O favorito dos nossos usuários.',
      features: [
        'Acesso ilimitado',
        'Todos os trainers',
        'Downloads offline',
        'Suporte prioritário',
      ],
      popular: true,
    },
    {
      name: 'VIP',
      price: isAnnual ? 69.9 : 89.9,
      description: 'Experiência completa e personalizada.',
      features: [
        'Tudo do Premium',
        'Consultoria mensal',
        'Plano nutricional básico',
      ],
      popular: false,
    },
  ]

  const handleSubscribe = (planName: string) => {
    toast.success(
      `Você escolheu o plano ${planName}! Redirecionando para pagamento...`,
    )
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
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

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-xl scale-105 z-10' : 'shadow-md'}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-white px-3 py-1">
                  Mais Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  R$ {plan.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.name)}
              >
                Assinar Agora
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
