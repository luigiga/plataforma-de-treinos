import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserMinus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FollowListProps {
  type: 'followers' | 'following'
}

export function FollowList({ type }: FollowListProps) {
  const { user } = useAuth()
  const { following, publicUsers, unfollowUser } = useData()

  if (!user) return null

  const list = following.filter((f) => {
    if (type === 'followers') {
      return f.followingId === user.id && f.status === 'accepted'
    } else {
      return f.followerId === user.id && f.status === 'accepted'
    }
  })

  if (list.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {type === 'followers'
          ? 'Você ainda não tem seguidores.'
          : 'Você ainda não segue ninguém.'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((item) => {
        const targetId =
          type === 'followers' ? item.followerId : item.followingId
        const profile = publicUsers.find((u) => u.id === targetId)
        if (!profile) return null

        return (
          <Card key={targetId} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${profile.username}`}>
                  <Avatar>
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    to={`/profile/${profile.username}`}
                    className="font-semibold hover:underline"
                  >
                    {profile.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
              </div>
              {type === 'following' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => unfollowUser(user.id, targetId)}
                  title="Deixar de seguir"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
