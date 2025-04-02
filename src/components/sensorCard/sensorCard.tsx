import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"

interface SensorCardProps {
  label: string
  value: number | undefined
  icon: string
  href: string
}

export function SensorCard({ label, value, icon }: SensorCardProps) {
  return (
    <Card className="hover:bg-gray-50 transition-colors h-full">
      <CardContent className="flex items-center justify-start p-6 h-full">
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={icon}
            alt={label}
            fill
            className="object-contain"
            sizes="(max-width: 128px) 100vw, 128px"
            priority
          />
        </div>
        <div className="ml-8">
          <div className="text-lg text-gray-500">{label}</div>
          <div className="text-3xl font-bold">{value ?? '--'}</div>
        </div>
      </CardContent>
    </Card>
  )
}