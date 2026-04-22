import { useMemo } from 'react'
import { formatTime, timesOverlap } from '../../lib/utils'
import { DayBadge } from '../ui/Badge'
import type { ScheduleEntry, DayOfWeek } from '../../types'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am–9pm
const DISPLAY_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SUBJECT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-orange-100 border-orange-300 text-orange-800',
]

function getColorIndex(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % SUBJECT_COLORS.length
}

interface Props {
  entries: ScheduleEntry[]
  onEdit: (entry: ScheduleEntry) => void
  onDelete: (id: string) => void
  filterTeacherId?: string
  filterRoomId?: string
}

function timeToFraction(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h + m / 60
}

function hasConflict(entry: ScheduleEntry, all: ScheduleEntry[]): boolean {
  return all.some(
    (e) =>
      e.id !== entry.id &&
      e.day === entry.day &&
      timesOverlap(entry.start_time, entry.end_time, e.start_time, e.end_time) &&
      (e.teacher_id === entry.teacher_id || e.room_id === entry.room_id)
  )
}

export function WeeklyTimetable({ entries, onEdit, onDelete, filterTeacherId, filterRoomId }: Props) {
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterTeacherId && e.teacher_id !== filterTeacherId) return false
      if (filterRoomId && e.room_id !== filterRoomId) return false
      return true
    })
  }, [entries, filterTeacherId, filterRoomId])

  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, ScheduleEntry[]>()
    for (const day of DISPLAY_DAYS) map.set(day, [])
    for (const e of filtered) {
      const day = e.day as DayOfWeek
      if (DISPLAY_DAYS.includes(day)) map.get(day)!.push(e)
    }
    return map
  }, [filtered])

  const DAY_START = 7
  const DAY_END = 21
  const TOTAL_HOURS = DAY_END - DAY_START
  const ROW_HEIGHT = 60

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-[64px_repeat(7,_1fr)] border-b border-gray-200">
          <div className="py-3" />
          {DISPLAY_DAYS.map((day) => (
            <div key={day} className="py-3 px-2 text-center">
              <DayBadge day={day} />
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative grid grid-cols-[64px_repeat(7,_1fr)]">
          {/* Time labels */}
          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-xs text-gray-400 leading-none"
                style={{ top: (h - DAY_START) * ROW_HEIGHT - 6 }}
              >
                {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
              </div>
            ))}
            <div style={{ height: TOTAL_HOURS * ROW_HEIGHT }} />
          </div>

          {/* Day columns */}
          {DISPLAY_DAYS.map((day) => {
            const dayEntries = byDay.get(day) ?? []
            return (
              <div
                key={day}
                className="relative border-l border-gray-100"
                style={{ height: TOTAL_HOURS * ROW_HEIGHT }}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-gray-100"
                    style={{ top: (h - DAY_START) * ROW_HEIGHT }}
                  />
                ))}

                {/* Entries */}
                {dayEntries.map((entry) => {
                  const top = (timeToFraction(entry.start_time) - DAY_START) * ROW_HEIGHT
                  const height = (timeToFraction(entry.end_time) - timeToFraction(entry.start_time)) * ROW_HEIGHT
                  const conflict = hasConflict(entry, entries)
                  const colorClass = conflict
                    ? 'bg-red-100 border-red-400 text-red-800'
                    : SUBJECT_COLORS[getColorIndex(entry.subject_id)]

                  return (
                    <div
                      key={entry.id}
                      className={`absolute inset-x-1 rounded-lg border px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group ${colorClass} ${conflict ? 'ring-2 ring-red-400' : ''}`}
                      style={{ top, height: Math.max(height - 2, 20) }}
                      onClick={() => onEdit(entry)}
                    >
                      <p className="text-xs font-semibold truncate leading-tight">
                        {entry.subject?.name ?? '—'}
                      </p>
                      <p className="text-xs opacity-70 truncate">
                        {entry.room?.name}
                      </p>
                      <p className="text-xs opacity-60 truncate">
                        {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                      </p>
                      {conflict && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" title="Conflict!" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
                        className="absolute bottom-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-white/70 text-red-600 text-xs hover:bg-red-600 hover:text-white transition-colors"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
