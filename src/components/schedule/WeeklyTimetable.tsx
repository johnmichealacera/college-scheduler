import { useState, useMemo } from 'react'
import { Pencil, User, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { formatTime, timesOverlap } from '../../lib/utils'
import { DayBadge } from '../ui/Badge'
import type { ScheduleEntry, DayOfWeek } from '../../types'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am–9pm
const DISPLAY_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Left-border accent style: light bg + strong left stripe
const ENTRY_STYLES = [
  'bg-blue-50 border-blue-200 border-l-blue-500 text-blue-900',
  'bg-violet-50 border-violet-200 border-l-violet-500 text-violet-900',
  'bg-emerald-50 border-emerald-200 border-l-emerald-500 text-emerald-900',
  'bg-amber-50 border-amber-200 border-l-amber-500 text-amber-900',
  'bg-rose-50 border-rose-200 border-l-rose-500 text-rose-900',
  'bg-teal-50 border-teal-200 border-l-teal-500 text-teal-900',
  'bg-indigo-50 border-indigo-200 border-l-indigo-500 text-indigo-900',
  'bg-orange-50 border-orange-200 border-l-orange-500 text-orange-900',
]

function getStyleIndex(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % ENTRY_STYLES.length
}

interface Props {
  entries: ScheduleEntry[]
  onEdit: (entry: ScheduleEntry) => void
  onDelete: (id: string) => void
  filterTeacherId?: string
  filterRoomId?: string
  filterSubjectId?: string
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

interface EntryLayout { col: number; numCols: number }

function computeLayout(entries: ScheduleEntry[]): Map<string, EntryLayout> {
  if (entries.length === 0) return new Map()

  const sorted = [...entries].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const colAssigned = new Map<string, number>()
  const colEndTimes: string[] = []

  for (const entry of sorted) {
    const col = colEndTimes.findIndex((end) => end <= entry.start_time)
    if (col === -1) {
      colAssigned.set(entry.id, colEndTimes.length)
      colEndTimes.push(entry.end_time)
    } else {
      colAssigned.set(entry.id, col)
      colEndTimes[col] = entry.end_time
    }
  }

  const layout = new Map<string, EntryLayout>()
  for (const entry of sorted) {
    const col = colAssigned.get(entry.id)!
    let maxCol = col
    for (const other of sorted) {
      if (other.id !== entry.id && timesOverlap(entry.start_time, entry.end_time, other.start_time, other.end_time)) {
        maxCol = Math.max(maxCol, colAssigned.get(other.id)!)
      }
    }
    layout.set(entry.id, { col, numCols: maxCol + 1 })
  }

  return layout
}

interface TooltipState {
  entry: ScheduleEntry
  conflict: boolean
  x: number
  y: number
}

export function WeeklyTimetable({ entries, onEdit, onDelete, filterTeacherId, filterRoomId, filterSubjectId }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterTeacherId && e.teacher_id !== filterTeacherId) return false
      if (filterRoomId && e.room_id !== filterRoomId) return false
      if (filterSubjectId && e.subject_id !== filterSubjectId) return false
      return true
    })
  }, [entries, filterTeacherId, filterRoomId, filterSubjectId])

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
    <>
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
              const layout = computeLayout(dayEntries)
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
                    const entryHeight = Math.max(height - 2, 20)
                    const conflict = hasConflict(entry, entries)
                    const { col, numCols } = layout.get(entry.id)!
                    const pctLeft = (col / numCols) * 100
                    const pctWidth = (1 / numCols) * 100
                    const cardStyle = conflict
                      ? 'bg-red-50 border-red-200 border-l-red-500 text-red-900'
                      : ENTRY_STYLES[getStyleIndex(entry.subject_id)]

                    return (
                      <div
                        key={entry.id}
                        className={`absolute border border-l-4 rounded-md cursor-pointer transition-shadow group hover:shadow-md hover:z-20 ${cardStyle}`}
                        style={{
                          top,
                          height: entryHeight,
                          left: `calc(${pctLeft}% + 2px)`,
                          width: `calc(${pctWidth}% - 4px)`,
                          zIndex: 10,
                        }}
                        onClick={() => onEdit(entry)}
                        onMouseEnter={(e) => {
                          const r = e.currentTarget.getBoundingClientRect()
                          setTooltip({ entry, conflict, x: r.left, y: r.bottom + 6 })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Text — clipped to card bounds */}
                        <div className="px-1.5 pt-1 overflow-hidden h-full">
                          <p className="text-[11px] font-semibold leading-tight truncate">
                            {entry.subject?.name ?? '—'}
                          </p>
                          {entryHeight > 36 && (
                            <p className="text-[10px] leading-tight truncate mt-0.5 opacity-60">
                              {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                            </p>
                          )}
                        </div>

                        {/* Conflict dot */}
                        {conflict && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        )}

                        {/* Action buttons */}
                        <div className="absolute bottom-0.5 right-0.5 hidden group-hover:flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEdit(entry) }}
                            className="flex items-center justify-center w-4 h-4 rounded-full bg-white/80 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil size={8} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
                            className="flex items-center justify-center w-4 h-4 rounded-full bg-white/80 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-[10px] leading-none"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tooltip — fixed overlay so it's never clipped by the scroll container */}
      {tooltip && (
        <div
          className="fixed z-[100] w-56 pointer-events-none"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 232),
            top: Math.min(tooltip.y, window.innerHeight - 190),
          }}
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3">
            <p className="font-semibold text-gray-900 text-sm leading-snug mb-2.5">
              {tooltip.entry.subject?.name ?? '—'}
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User size={11} className="shrink-0 text-gray-400" />
                <span className="truncate">{tooltip.entry.teacher?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin size={11} className="shrink-0 text-gray-400" />
                <span className="truncate">{tooltip.entry.room?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock size={11} className="shrink-0 text-gray-400" />
                <span>{formatTime(tooltip.entry.start_time)} – {formatTime(tooltip.entry.end_time)}</span>
              </div>
            </div>
            {tooltip.conflict && (
              <div className="mt-2.5 pt-2 border-t border-red-100 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <AlertTriangle size={11} />
                <span>Schedule conflict</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
