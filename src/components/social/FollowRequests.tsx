import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FollowRequests() {
  const { user } = useAuth()
  const { following, publicUsers, acceptFollowRequest, rejectFollowRequest } =
    useData()

  if (!user) return null

  const requests = following.filter(
    (f) => f.followingId === user.id && f.status === 'pending',
  )

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma solicitação pendente.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {requests.map((req) => {
        const requester = publicUsers.find((u) => u.id === req.followerId)
        if (!requester) return null

        return (
          <Card key={req.followerId} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${requester.username}`}>
                  <Avatar>
                    <AvatarImage src={requester.avatar} />
                    <AvatarFallback>{requester.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    to={`/profile/${requester.username}`}
                    className="font-semibold hover:underline"
                  >
                    {requester.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    @{requester.username}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => rejectFollowRequest(req.followerId, user.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                  onClick={() => acceptFollowRequest(req.followerId, user.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
