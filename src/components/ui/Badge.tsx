import { cn } from '../../lib/utils'

type Color = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'

const colors: Record<Color, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
}

const DAY_COLORS: Record<string, Color> = {
  Monday: 'blue',
  Tuesday: 'purple',
  Wednesday: 'green',
  Thursday: 'yellow',
  Friday: 'red',
  Saturday: 'gray',
  Sunday: 'gray',
}

export function Badge({ children, color = 'gray', className }: { children: React.ReactNode; color?: Color; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colors[color], className)}>
      {children}
    </span>
  )
}

export function DayBadge({ day }: { day: string }) {
  return <Badge color={DAY_COLORS[day] ?? 'gray'}>{day}</Badge>
}
