import { useState } from 'react'
import { useData, Message } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'

export function TrainerMessages() {
  const { messages, sendMessage, publicUsers } = useData()
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>('u1') // Default to first user for demo

  if (!user) return null

  // Group messages by user
  const conversations = Array.from(
    new Set(
      messages
        .filter((m) => m.senderId === user.id || m.receiverId === user.id)
        .map((m) => (m.senderId === user.id ? m.receiverId : m.senderId)),
    ),
  )

  const currentMessages = messages.filter(
    (m) =>
      (m.senderId === user.id && m.receiverId === selectedUserId) ||
      (m.senderId === selectedUserId && m.receiverId === user.id),
  )

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserId && newMessage.trim()) {
      sendMessage(user.id, selectedUserId, newMessage)
      setNewMessage('')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] animate-fade-in">
      <Card className="md:col-span-1 h-[200px] md:h-auto">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="p-4 border-b font-semibold">Conversas</div>
          <ScrollArea className="flex-1">
            {conversations.map((contactId) => {
              const contact = publicUsers.find((u) => u.id === contactId)
              if (!contact) return null
              return (
                <div
                  key={contactId}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${selectedUserId === contactId ? 'bg-secondary/50' : ''}`}
                  onClick={() => setSelectedUserId(contactId)}
                >
                  <Avatar>
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Clique para ver a conversa
                    </p>
                  </div>
                </div>
              )
            })}
            {conversations.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Nenhuma conversa iniciada.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col h-[400px] md:h-auto">
        <CardContent className="flex-1 p-0 flex flex-col h-full">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b font-semibold flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      publicUsers.find((u) => u.id === selectedUserId)?.avatar
                    }
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                {publicUsers.find((u) => u.id === selectedUserId)?.name}
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${msg.senderId === user.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Selecione uma conversa para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
