import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, UserX } from 'lucide-react'
import { toast } from 'sonner'

interface PublicProfileData {
  username: string
  full_name: string
  bio: string
  avatar_url: string
  role: string
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name, bio, avatar_url, role')
          .eq('username', username)
          .single()

        if (error) {
          throw error
        }

        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Perfil não encontrado ou erro ao carregar.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <UserX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Perfil não encontrado</h1>
        <p className="text-muted-foreground mb-8">
          O usuário @{username} não existe ou não está disponível.
        </p>
        <Button asChild>
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl animate-fade-in">
      <Button variant="ghost" asChild className="mb-6 pl-0">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>

      <Card className="border-none shadow-elevation overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <CardContent className="relative pt-0 pb-8 px-6 md:px-10">
          <div className="flex flex-col items-center -mt-16 mb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center mt-4">
              <h1 className="text-3xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground font-medium">
                @{profile.username}
              </p>
              <Badge variant="secondary" className="mt-2 capitalize">
                {profile.role === 'trainer' ? 'Personal Trainer' : 'Assinante'}
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Sobre
              </h3>
              <p className="text-lg leading-relaxed">
                {profile.bio ||
                  'Este usuário ainda não escreveu uma biografia.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
