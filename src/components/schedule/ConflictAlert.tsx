import { AlertTriangle, Clock } from 'lucide-react'
import type { Conflict, TimeSlot } from '../../types'
import { formatTime } from '../../lib/utils'

interface ConflictAlertProps {
  conflicts: Conflict[]
  suggestedSlots?: TimeSlot[]
  onSelectSlot?: (slot: TimeSlot) => void
}

export function ConflictAlert({ conflicts, suggestedSlots, onSelectSlot }: ConflictAlertProps) {
  if (!conflicts.length) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
        <AlertTriangle size={16} />
        {conflicts.length === 1 ? 'Scheduling Conflict Detected' : `${conflicts.length} Conflicts Detected`}
      </div>
      <ul className="space-y-1">
        {conflicts.map((c, i) => (
          <li key={i} className="text-sm text-red-600 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">•</span>
            <span>
              <span className="font-medium capitalize">{c.type} conflict:</span> {c.message}
            </span>
          </li>
        ))}
      </ul>

      {suggestedSlots && suggestedSlots.length > 0 && onSelectSlot && (
        <div className="pt-1 border-t border-red-200">
          <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
            <Clock size={12} /> Available time slots on this day:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedSlots.slice(0, 8).map((slot, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className="text-xs px-2.5 py-1 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
