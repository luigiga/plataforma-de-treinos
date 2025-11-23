import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface CommentsSectionProps {
  workoutId: string
}

export function CommentsSection({ workoutId }: CommentsSectionProps) {
  const { reviews, addReview } = useData()
  const { user, updateUser } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [rating, setRating] = useState(5)

  const workoutReviews = reviews.filter((r) => r.workoutId === workoutId)
  const averageRating =
    workoutReviews.length > 0
      ? workoutReviews.reduce((acc, r) => acc + r.rating, 0) /
        workoutReviews.length
      : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    addReview({
      workoutId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar || '',
      rating,
      comment: newComment,
    })

    // Gamification Logic
    const newPoints = (user.points || 0) + 5
    const newBadges = [...(user.badges || [])]

    // Mock check for social badge (usually would check review count)
    if (!newBadges.includes('social') && Math.random() > 0.7) {
      newBadges.push('social')
      toast.success('Nova Conquista: Social! (Contribuiu com a comunidade)')
    }

    updateUser({ points: newPoints, badges: newBadges })
    toast.success('Avaliação enviada! (+5 XP)')

    setNewComment('')
    setRating(5)
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Avaliações</h2>
        <div className="flex items-center gap-2">
          <Star className="fill-yellow-400 text-yellow-400" size={24} />
          <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({workoutReviews.length})
          </span>
        </div>
      </div>

      {user && user.role === 'subscriber' && (
        <Card className="border-none shadow-sm bg-secondary/30">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Sua nota:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={20}
                        className={cn(
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="O que você achou deste treino?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-background"
                required
              />
              <Button type="submit" className="btn-press">
                Enviar Avaliação
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {workoutReviews.map((review) => (
          <div
            key={review.id}
            className="flex gap-4 p-4 rounded-xl bg-card shadow-sm border border-border/50 transition-all hover:shadow-md"
          >
            <Avatar>
              <AvatarImage src={review.userAvatar} />
              <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold">{review.userName}</h4>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={cn(
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30',
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          </div>
        ))}
        {workoutReviews.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Seja o primeiro a avaliar este treino!
          </p>
        )}
      </div>
    </div>
  )
}
