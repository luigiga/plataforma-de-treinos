import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, DollarSign, Users, BarChart } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function ForTrainers() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* Hero */}
      <section className="py-16 md:py-20 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Potencialize sua Carreira
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A ferramenta que faltava para você gerenciar seus alunos, vender
            seus treinos e escalar seu negócio fitness.
          </p>
          <Button size="lg" className="h-12 px-8 w-full sm:w-auto" asChild>
            <Link to="/auth?tab=register&role=trainer">Começar Agora</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: '1. Crie seu Perfil',
                desc: 'Cadastre-se e mostre suas especialidades e certificações.',
              },
              {
                title: '2. Publique Treinos',
                desc: 'Use nossa ferramenta intuitiva para criar rotinas completas.',
              },
              {
                title: '3. Monetize',
                desc: 'Receba por assinantes que acessam seu conteúdo exclusivo.',
              },
            ].map((step, i) => (
              <Card key={i} className="text-center border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Por que se juntar a nós?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: DollarSign,
                title: 'Renda Extra',
                desc: 'Ganhe dinheiro com seus treinos online.',
              },
              {
                icon: Users,
                title: 'Mais Alcance',
                desc: 'Atinja alunos de todo o país.',
              },
              {
                icon: BarChart,
                title: 'Gestão Simples',
                desc: 'Acompanhe métricas e resultados.',
              },
              {
                icon: Check,
                title: 'Flexibilidade',
                desc: 'Trabalhe de onde quiser, quando quiser.',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 bg-background rounded-xl shadow-sm"
              >
                <div className="bg-primary/10 p-4 rounded-full text-primary mb-4">
                  <benefit.icon size={24} />
                </div>
                <h3 className="font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 max-w-3xl mx-auto px-4 w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Perguntas Frequentes
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              Quanto custa para ser trainer?
            </AccordionTrigger>
            <AccordionContent>
              O cadastro é gratuito. Cobramos apenas uma pequena taxa
              administrativa sobre as assinaturas geradas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              Preciso de certificação?
            </AccordionTrigger>
            <AccordionContent>
              Sim, prezamos pela qualidade e segurança. Solicitaremos
              comprovante de certificação profissional (CREF).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              Como recebo meus pagamentos?
            </AccordionTrigger>
            <AccordionContent>
              Os pagamentos são transferidos mensalmente para sua conta bancária
              cadastrada.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="py-16 md:py-20 text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Pronto para começar?
        </h2>
        <Button size="lg" className="w-full sm:w-auto" asChild>
          <Link to="/auth?tab=register&role=trainer">
            Criar Conta de Trainer
          </Link>
        </Button>
      </section>
    </div>
  )
}
