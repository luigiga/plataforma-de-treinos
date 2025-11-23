import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareProfileDialogProps {
  username: string
}

export function ShareProfileDialog({ username }: ShareProfileDialogProps) {
  const [copied, setCopied] = useState(false)
  const profileUrl = `${window.location.origin}/profile/${username}`

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    toast.success('Link copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Perfil</DialogTitle>
          <DialogDescription>
            Qualquer pessoa com este link poderá ver seu perfil público.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={profileUrl}
              readOnly
              className="h-9"
            />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copiar</span>
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleCopy}
          >
            {copied ? 'Copiado!' : 'Copiar Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
