import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { logger } from '@/lib/logger'

type ConfirmStatus = 'loading' | 'success' | 'error'
type RedirectRole = 'subscriber' | 'trainer' | 'admin'
type VerifyType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'email'

function isRedirectRole(value: unknown): value is RedirectRole {
  return value === 'subscriber' || value === 'trainer' || value === 'admin'
}

function isVerifyType(value: string | null): value is VerifyType {
  return (
    value === 'signup' ||
    value === 'magiclink' ||
    value === 'recovery' ||
    value === 'invite' ||
    value === 'email_change' ||
    value === 'email'
  )
}

function getDefaultDashboardPath(role?: RedirectRole | null) {
  switch (role) {
    case 'admin':
      return '/admin-dashboard'
    case 'trainer':
      return '/trainer-dashboard'
    case 'subscriber':
    default:
      return '/dashboard'
  }
}

function getRoleFromSession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) {
  const metadataRole = session?.user?.user_metadata?.role
  return isRedirectRole(metadataRole) ? metadataRole : 'subscriber'
}

export default function EmailConfirm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<ConfirmStatus>('loading')
  const [message, setMessage] = useState('Verificando confirmação de email...')

  const hashParams = useMemo(() => {
    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash

    return new URLSearchParams(rawHash)
  }, [])

  useEffect(() => {
    let isMounted = true
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null

    const redirectAfterSuccess = (role?: RedirectRole | null, delayMs = 1200) => {
      redirectTimeout = setTimeout(() => {
        navigate(getDefaultDashboardPath(role), { replace: true })
      }, delayMs)
    }

    const redirectToLogin = (delayMs = 1800) => {
      redirectTimeout = setTimeout(() => {
        navigate('/auth?tab=login', { replace: true })
      }, delayMs)
    }

    const handleEmailConfirmation = async () => {
      try {
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
        const typeParam = searchParams.get('type') || hashParams.get('type')
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        let currentSession: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          currentSession = data.session
        } else if (tokenHash && isVerifyType(typeParam)) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: typeParam,
          })
          if (error) throw error
          currentSession = data.session
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
          currentSession = data.session
        } else {
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          currentSession = data.session
        }

        if (!isMounted) return

        if (currentSession?.user) {
          const role = user?.role || getRoleFromSession(currentSession)
          setStatus('success')
          setMessage('Email confirmado com sucesso! Redirecionando...')
          redirectAfterSuccess(role)
          return
        }

        setStatus('success')
        setMessage('Email confirmado! Faça login para continuar.')
        redirectToLogin()
      } catch (error: any) {
        logger.error('Error confirming email', error)

        if (!isMounted) return

        setStatus('error')
        setMessage(error?.message || 'Erro ao confirmar email. Tente novamente.')
      }
    }

    void handleEmailConfirmation()

    return () => {
      isMounted = false
      if (redirectTimeout) {
        clearTimeout(redirectTimeout)
      }
    }
  }, [hashParams, navigate, searchParams, user])

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
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth?tab=register')}
                >
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
