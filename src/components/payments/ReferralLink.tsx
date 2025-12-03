import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { referralService } from '@/services/payments/referrals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Copy, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function ReferralLink() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const referralLink = user
    ? referralService.generateReferralLink(user.id)
    : ''

  const handleCopy = () => {
    if (!referralLink) return

    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Link copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user || user.role !== 'trainer') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Link de Referência
        </CardTitle>
        <CardDescription>
          Compartilhe este link e ganhe 90% dos pagamentos quando alguém se inscrever através dele!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            value={referralLink}
            readOnly
            className="flex-1"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Quando alguém se inscrever usando este link, você receberá 90% da receita em vez de 80%.
        </p>
      </CardContent>
    </Card>
  )
}

