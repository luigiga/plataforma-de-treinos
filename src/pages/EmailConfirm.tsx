import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/logger'

/**
 * Página para processar confirmação de email
 * Esta página será usada quando a confirmação de email estiver habilitada em produção
 * O Supabase redireciona para esta página após o usuário clicar no link de confirmação
 */
export default function EmailConfirm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando confirmação de email...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // O Supabase adiciona os tokens na URL como query params
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          setStatus('error')
          setMessage('Link de confirmação inválido ou expirado.')
          return
        }

        // Verificar a sessão atual
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        // Se já está autenticado, redirecionar
        if (session?.user) {
          setStatus('success')
          setMessage('Email confirmado com sucesso! Redirecionando...')
          
          // Redirecionar após 1 segundo
          setTimeout(() => {
            if (user?.role === 'admin') {
              navigate('/admin-dashboard')
            } else if (user?.role === 'trainer') {
              navigate('/trainer-dashboard')
            } else {
              navigate('/dashboard')
            }
          }, 1000)
        } else {
          // Se não está autenticado, tentar fazer login com o token
          // O Supabase geralmente faz isso automaticamente, mas podemos verificar
          setStatus('success')
          setMessage('Email confirmado! Faça login para continuar.')
          
          setTimeout(() => {
            navigate('/auth?tab=login')
          }, 2000)
        }
      } catch (error: any) {
        logger.error('Error confirming email', error)
        setStatus('error')
        setMessage(error.message || 'Erro ao confirmar email. Tente novamente.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, navigate, user])

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-140px)] py-6 md:py-10 px-4">
      <Card className="w-full max-w-md shadow-glass border-white/20 bg-white/50 backdrop-blur-md dark:bg-black/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Confirmação de Email
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Aguarde enquanto verificamos...'}
            {status === 'success' && 'Email confirmado!'}
            {status === 'error' && 'Erro na confirmação'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-center text-foreground">{message}</p>
              <Button onClick={() => navigate('/auth?tab=login')} className="mt-4">
                Ir para Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-destructive">{message}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => navigate('/auth?tab=register')}>
                  Criar Nova Conta
                </Button>
                <Button onClick={() => navigate('/auth?tab=login')}>
                  Fazer Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

