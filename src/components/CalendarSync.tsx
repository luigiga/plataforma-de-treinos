import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface CalendarSyncProps {
  label?: string
  eventTitle?: string
  eventDescription?: string
}

export function CalendarSync({
  label = 'Sincronizar Calendário',
  eventTitle = 'Treino FitPlatform',
  eventDescription = 'Sessão de treino agendada.',
}: CalendarSyncProps) {
  const [synced, setSynced] = useState(false)

  const handleSync = () => {
    // Mock calendar sync logic
    // In a real app, this would generate an .ics file or use Google Calendar API
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDescription)}`

    window.open(googleCalendarUrl, '_blank')
    setSynced(true)
    toast.success('Calendário sincronizado com sucesso!')

    setTimeout(() => setSynced(false), 3000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      className="gap-2 transition-all"
    >
      {synced ? (
        <>
          <Check className="h-4 w-4 text-green-500" /> Sincronizado
        </>
      ) : (
        <>
          <CalendarIcon className="h-4 w-4" /> {label}
        </>
      )}
    </Button>
  )
}
