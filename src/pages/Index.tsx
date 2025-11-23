import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Users, TrendingUp, PlayCircle, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

export default function Index() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
                Transforme seu Corpo. <br />
                <span className="text-primary">Acesse Treinos Exclusivos.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 text-balance">
                A plataforma completa que conecta você aos melhores personal
                trainers. Treine onde e quando quiser com orientação
                profissional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="text-lg px-8 h-14 rounded-xl"
                  asChild
                >
                  <Link to="/auth?tab=register&role=subscriber">
                    Começar Agora
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14 rounded-xl"
                  asChild
                >
                  <Link to="/trainers">Sou Personal Trainer</Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in lg:animate-slide-up delay-200">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="https://img.usecurling.com/p/800/600?q=fitness%20training"
                  alt="Treino em casa"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-card p-4 rounded-xl shadow-xl flex items-center gap-3 animate-float hidden md:flex">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm">Resultados Reais</p>
                  <p className="text-xs text-muted-foreground">
                    +15% massa muscular
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Subscribers */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Treinos Personalizados ao Seu Alcance
            </h2>
            <p className="text-muted-foreground text-lg">
              Tenha acesso a uma biblioteca diversificada de treinos criados por
              especialistas para todos os níveis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: PlayCircle,
                title: 'Diversidade de Treinos',
                desc: 'De Yoga a HIIT, encontre o treino perfeito para seu objetivo.',
              },
              {
                icon: TrendingUp,
                title: 'Acompanhe seu Progresso',
                desc: 'Visualize sua evolução e mantenha-se motivado.',
              },
              {
                icon: Star,
                title: 'Conteúdo Exclusivo',
                desc: 'Acesse dicas e técnicas que só os pros conhecem.',
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary mb-6">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link to="/plans">Ver Planos de Assinatura</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Trainers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <img
                src="https://img.usecurling.com/p/600/800?q=personal%20trainer"
                alt="Personal Trainer"
                className="rounded-2xl shadow-2xl w-full max-w-md mx-auto lg:mx-0"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Compartilhe Seu Conhecimento. <br />
                Alcance Mais Alunos.
              </h2>
              <p className="text-lg text-muted-foreground">
                A plataforma ideal para personal trainers que querem escalar seu
                negócio, gerenciar alunos e monetizar seu conteúdo de forma
                simples.
              </p>
              <ul className="space-y-4">
                {[
                  'Crie e publique treinos em minutos',
                  'Gerencie seus assinantes em um só lugar',
                  'Receba pagamentos de forma segura e automática',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-primary flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" asChild>
                <Link to="/auth?tab=register&role=trainer">
                  Cadastrar Meu Perfil de Trainer
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            O que dizem nossos usuários
          </h2>
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {[1, 2, 3].map((_, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/2 p-4"
                >
                  <Card className="h-full border-none shadow-md">
                    <CardContent className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?gender=${index % 2 === 0 ? 'female' : 'male'}&seed=${index}`}
                          />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">Usuário {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            Assinante desde 2024
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground italic">
                        "A plataforma mudou minha rotina de treinos. A qualidade
                        dos vídeos e a facilidade de uso são incríveis!"
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-bold">
            Pronto para Começar Sua Jornada Fitness?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Junte-se à nossa comunidade de personal trainers e assinantes hoje
            mesmo!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              variant="secondary"
              className="text-primary font-bold h-14 px-8"
              asChild
            >
              <Link to="/auth?tab=register&role=subscriber">Quero Treinar</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10 h-14 px-8"
              asChild
            >
              <Link to="/auth?tab=register&role=trainer">Sou Profissional</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
