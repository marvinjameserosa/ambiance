import { MapPin } from 'lucide-react'

interface HeaderProps {
  timestamp?: string;
  location?: string;  
}

export function Header({ timestamp = 'No data', location = 'Unknown' }: HeaderProps) {
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date)
    } catch {
      return 'No data'
    }
  }

  return (
    <header className="flex justify-between items-center p-4 bg-red-900 text-white">
      <h1 className="text-2xl font-bold text-yellow-400">AMBIANCE</h1>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <MapPin size={18} />
          <span className="text-sm font-medium">
            {location}
          </span>
        </div>
        <div className="text-sm font-medium">
          Time: {formatTime(timestamp)}
        </div>
      </div>
    </header>
  )
}