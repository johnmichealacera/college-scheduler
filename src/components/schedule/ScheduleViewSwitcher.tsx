'use client'

import { Newspaper } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '../../lib/utils'
import type { ScheduleView } from '../../types'

const OPTIONS: { value: ScheduleView; label: string; path: string }[] = [
  { value: 'school', label: 'School Classes', path: '/schedule' },
  { value: 'dspc', label: 'DSPC Event', path: '/dspc' },
]

export function ScheduleViewSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const value: ScheduleView = pathname.startsWith('/dspc') ? 'dspc' : 'school'

  return (
    <div className="flex items-center gap-2">
      <Newspaper size={14} className="text-gray-400 shrink-0 hidden sm:block" />
      <select
        value={value}
        onChange={(e) => {
          const next = OPTIONS.find((option) => option.value === e.target.value)
          if (next) router.push(next.path)
        }}
        aria-label="Schedule type"
        className={cn(
          'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
          'cursor-pointer min-w-[11.5rem]'
        )}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
