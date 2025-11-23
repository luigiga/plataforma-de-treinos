import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/context/AuthContext'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
    isTrainer: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, register, user } = useAuth()
  const defaultTab = searchParams.get('tab') || 'login'
  const defaultRole = searchParams.get('role') === 'trainer'

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard')
      else if (user.role === 'trainer') navigate('/trainer-dashboard')
      else navigate('/dashboard')
    }
  }, [user, navigate])

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isTrainer: defaultRole,
    },
  })

  async function onLogin(data: z.infer<typeof loginSchema>) {
    const { error } = await login(data.email, data.password)
    if (error) {
      loginForm.setError('root', {
        message: 'Falha no login. Verifique suas credenciais.',
      })
    }
  }

  async function onRegister(data: z.infer<typeof registerSchema>) {
    const { error } = await register(data.email, data.password, {
      name: data.name,
      role: data.isTrainer ? 'trainer' : 'subscriber',
      avatar: `https://img.usecurling.com/ppl/medium?gender=${Math.random() > 0.5 ? 'male' : 'female'}`,
    })

    if (!error) {
      // Auto login after registration
      const { error: loginError } = await login(data.email, data.password)
      if (loginError) {
        toast.error('Erro ao fazer login automático. Tente entrar manualmente.')
        setSearchParams({ tab: 'login' })
      }
    }
  }

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value })
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-140px)] py-6 md:py-10 px-4">
      <Card className="w-full max-w-md shadow-glass border-white/20 bg-white/50 backdrop-blur-md dark:bg-black/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Bem-vindo
          </CardTitle>
          <CardDescription>
            Entre ou crie sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={defaultTab}
            value={defaultTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {loginForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full rounded-xl h-12 text-lg"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting
                      ? 'Entrando...'
                      : 'Entrar'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegister)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="isTrainer"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-secondary/20">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sou Personal Trainer</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full rounded-xl h-12 text-lg"
                    disabled={registerForm.formState.isSubmitting}
                  >
                    {registerForm.formState.isSubmitting
                      ? 'Criando Conta...'
                      : 'Criar Conta'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
