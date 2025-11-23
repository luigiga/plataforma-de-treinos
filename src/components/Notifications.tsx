import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

export function Notifications() {
  const { notifications, markNotificationAsRead } = useData()
  const { user } = useAuth()

  const userNotifications = notifications.filter(
    (n) => n.userId === user?.id || n.userId === 'all' || n.userId === '1',
  )

  const unreadCount = userNotifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full btn-press hover:bg-secondary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 shadow-glass border-white/20"
        align="end"
      >
        <div className="p-4 border-b border-border bg-secondary/30 backdrop-blur-sm">
          <h4 className="font-semibold leading-none">Notificações</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Você tem {unreadCount} novas mensagens.
          </p>
        </div>
        <ScrollArea className="h-[300px]">
          {userNotifications.length > 0 ? (
            <div className="flex flex-col">
              {userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer',
                    !notification.read &&
                      'bg-primary/5 border-l-2 border-l-primary',
                  )}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  {notification.link ? (
                    <Link to={notification.link} className="block">
                      <p className="text-sm font-medium mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()}{' '}
                        -{' '}
                        {new Date(notification.createdAt).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' },
                        )}
                      </p>
                    </Link>
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma notificação.
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
