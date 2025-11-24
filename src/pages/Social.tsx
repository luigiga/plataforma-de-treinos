import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData, PublicUser } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search,
  UserPlus,
  UserCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/use-debounce'

export default function Social() {
  const { publicUsers, followUser, unfollowUser, isFollowing, searchUsers } =
    useData()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PublicUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch) {
        setSearchResults(publicUsers)
        return
      }

      setIsSearching(true)
      try {
        const results = await searchUsers(debouncedSearch)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearch, publicUsers, searchUsers])

  const handleFollowToggle = (targetUserId: string) => {
    if (!user) return
    if (isFollowing(user.id, targetUserId)) {
      unfollowUser(user.id, targetUserId)
    } else {
      followUser(user.id, targetUserId)
    }
  }

  const displayUsers = searchResults.filter((u) => u.id !== user?.id)

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Comunidade Fitness
        </h1>
        <p className="text-muted-foreground">
          Encontre treinadores e parceiros de treino.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nome, username ou email..."
          className="pl-10 rounded-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary h-4 w-4 animate-spin" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayUsers.map((publicUser) => {
          const isFollowed = user ? isFollowing(user.id, publicUser.id) : false
          return (
            <Card
              key={publicUser.id}
              className="border-none shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <Link to={`/profile/${publicUser.username}`}>
                  <Avatar className="h-16 w-16 border-2 border-primary/10 hover:border-primary/30 transition-colors">
                    <AvatarImage src={publicUser.avatar} />
                    <AvatarFallback>{publicUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/profile/${publicUser.username}`}
                      className="font-bold truncate hover:text-primary transition-colors"
                    >
                      {publicUser.name}
                    </Link>
                    <Badge
                      variant={
                        publicUser.role === 'trainer' ? 'default' : 'secondary'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {publicUser.role === 'trainer' ? 'Trainer' : 'User'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-3">
                    {publicUser.bio || 'Sem biografia.'}
                  </p>
                  <div className="flex gap-2">
                    {user && (
                      <Button
                        size="sm"
                        variant={isFollowed ? 'outline' : 'default'}
                        className="flex-1 h-8"
                        onClick={() => handleFollowToggle(publicUser.id)}
                      >
                        {isFollowed ? (
                          <>
                            <UserCheck className="mr-2 h-3 w-3" /> Seguindo
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-3 w-3" /> Seguir
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      asChild
                    >
                      <Link to={`/profile/${publicUser.username}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {displayUsers.length === 0 && !isSearching && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum usuário encontrado.
        </div>
      )}
    </div>
  )
}
