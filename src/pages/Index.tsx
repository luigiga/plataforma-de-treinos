import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Users, TrendingUp, PlayCircle, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OptimizedImage } from '@/components/OptimizedImage'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

export default function Index() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <section className="relative py-12 md:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-tight">
                Transforme seu <span className="text-primary">Corpo</span>.{' '}
                <br />
                Eleve sua <span className="text-primary">Mente</span>.
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 text-balance">
                A plataforma premium que conecta você à elite dos personal
                trainers. Design intuitivo, dados avançados e resultados reais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto">
                <Button
                  size="lg"
                  className="text-lg px-8 h-12 md:h-14 rounded-full shadow-lg shadow-primary/25 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/auth?tab=register&role=subscriber">
                    Começar Agora
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-12 md:h-14 rounded-full border-2 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/trainers">Sou Personal Trainer</Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in lg:animate-slide-up delay-200 mt-8 lg:mt-0">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 border-4 border-white dark:border-gray-800">
                <OptimizedImage
                  src="https://img.usecurling.com/p/800/600?q=fitness%20training"
                  alt="Treino em casa"
                  className="w-full h-auto object-cover"
                  lazy={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-card p-4 rounded-2xl shadow-glass flex items-center gap-3 animate-float md:flex border border-white/20">
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

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              Treinos Personalizados
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Uma biblioteca diversificada criada por especialistas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: PlayCircle,
                title: 'Diversidade',
                desc: 'De Yoga a HIIT, encontre o treino perfeito.',
              },
              {
                icon: TrendingUp,
                title: 'Analytics',
                desc: 'Visualize sua evolução com gráficos detalhados.',
              },
              {
                icon: Star,
                title: 'Exclusividade',
                desc: 'Conteúdo premium que você só encontra aqui.',
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card"
              >
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center text-primary mb-6">
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
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <OptimizedImage
                src="https://img.usecurling.com/p/600/800?q=personal%20trainer"
                alt="Personal Trainer"
                className="rounded-3xl shadow-2xl w-full max-w-md mx-auto lg:mx-0 border-4 border-white dark:border-gray-800"
                lazy={false}
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6 md:space-y-8 text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-bold">
                Para Profissionais
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                A plataforma ideal para personal trainers que querem escalar seu
                negócio. Gerencie alunos, analise métricas e monetize seu
                conteúdo.
              </p>
              <ul className="space-y-4 inline-block text-left">
                {[
                  'Publique treinos em minutos',
                  'Dashboard analítico completo',
                  'Pagamentos automáticos',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/20 p-1 rounded-full">
                      <CheckCircle2 className="text-primary w-4 h-4" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Button
                  size="lg"
                  className="rounded-full px-8 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/auth?tab=register&role=trainer">
                    Cadastrar Perfil Profissional
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            O que dizem nossos usuários
          </h2>
          <Carousel className="w-full max-w-4xl mx-auto px-4 md:px-12">
            <CarouselContent>
              {[1, 2, 3].map((_, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/2 p-2 md:p-4"
                >
                  <Card className="h-full border-none shadow-md bg-card">
                    <CardContent className="p-6 md:p-8 flex flex-col gap-4">
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
                            Assinante Premium
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground italic text-sm md:text-base">
                        "A interface é linda e os gráficos de progresso me
                        motivam muito!"
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center space-y-6 md:space-y-8 relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Comece Sua Jornada Hoje
          </h2>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Junte-se à comunidade fitness mais exclusiva da web.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="text-primary font-bold h-12 md:h-14 px-8 rounded-full w-full sm:w-auto"
              asChild
            >
              <Link to="/auth?tab=register&role=subscriber">Quero Treinar</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10 h-12 md:h-14 px-8 rounded-full w-full sm:w-auto"
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
