import { clsx, type ClassValue } from 'clsx'
import type { DspcScheduleEntry, ScheduleEntry, Conflict, TimeSlot } from '../types'
import { contestSlotLabel, dspcToScheduleEntry, weekdayFromIso } from './dspc'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = timeToMinutes(s1)
  const end1 = timeToMinutes(e1)
  const start2 = timeToMinutes(s2)
  const end2 = timeToMinutes(e2)
  return start1 < end2 && start2 < end1
}

export function detectConflicts(
  proposed: { teacher_id: string; room_id: string; day: string; start_time: string; end_time: string },
  existing: ScheduleEntry[],
  excludeId?: string
): Conflict[] {
  const conflicts: Conflict[] = []
  const candidates = existing.filter((e) => e.id !== excludeId && e.day === proposed.day)

  for (const entry of candidates) {
    if (!timesOverlap(proposed.start_time, proposed.end_time, entry.start_time, entry.end_time)) continue

    if (entry.teacher_id === proposed.teacher_id) {
      conflicts.push({
        type: 'teacher',
        message: `Teacher is already scheduled for "${entry.teacher?.name ?? 'another class'}" in ${entry.room?.name ?? 'another room'} at this time.`,
        conflictingEntry: entry,
      })
    }

    if (entry.room_id === proposed.room_id) {
      conflicts.push({
        type: 'room',
        message: `Room is already booked for "${entry.subject?.name ?? 'another subject'}" at this time.`,
        conflictingEntry: entry,
      })
    }
  }

  return conflicts
}

export function suggestAvailableSlots(
  existing: ScheduleEntry[],
  day: string,
  teacher_id: string,
  room_id: string,
  durationMinutes = 60
): TimeSlot[] {
  const DAY_START = 7 * 60
  const DAY_END = 21 * 60
  const STEP = 30

  const blocked = existing
    .filter((e) => e.day === day && (e.teacher_id === teacher_id || e.room_id === room_id))
    .map((e) => ({ start: timeToMinutes(e.start_time), end: timeToMinutes(e.end_time) }))

  const slots: TimeSlot[] = []
  for (let t = DAY_START; t + durationMinutes <= DAY_END; t += STEP) {
    const slotEnd = t + durationMinutes
    const hasConflict = blocked.some((b) => t < b.end && b.start < slotEnd)
    if (!hasConflict) {
      slots.push({ start: minutesToTime(t), end: minutesToTime(slotEnd) })
    }
  }
  return slots
}

export function detectDspcConflicts(
  proposed: { facilitator_id: string; room_id: string; event_date: string; start_time: string; end_time: string },
  existing: DspcScheduleEntry[],
  excludeId?: string
): Conflict[] {
  const conflicts: Conflict[] = []
  const eventDate = proposed.event_date.slice(0, 10)
  const candidates = existing.filter((e) => e.id !== excludeId && e.event_date.slice(0, 10) === eventDate)

  for (const entry of candidates) {
    if (!timesOverlap(proposed.start_time, proposed.end_time, entry.start_time, entry.end_time)) continue

    const mapped = dspcToScheduleEntry(entry)

    if (entry.facilitator_id === proposed.facilitator_id) {
      conflicts.push({
        type: 'facilitator',
        message: `Facilitator is already assigned to "${contestSlotLabel(entry)}" in ${entry.room?.name ?? 'another venue'} at this time.`,
        conflictingEntry: mapped,
      })
    }

    if (entry.room_id === proposed.room_id) {
      conflicts.push({
        type: 'room',
        message: `Venue is already booked for "${contestSlotLabel(entry)}" at this time.`,
        conflictingEntry: mapped,
      })
    }
  }

  return conflicts
}

export function suggestDspcSlots(
  existing: DspcScheduleEntry[],
  event_date: string,
  facilitator_id: string,
  room_id: string,
  durationMinutes = 60
): TimeSlot[] {
  const date = event_date.slice(0, 10)
  return suggestAvailableSlots(
    existing.filter((e) => e.event_date.slice(0, 10) === date).map(dspcToScheduleEntry),
    weekdayFromIso(date),
    facilitator_id,
    room_id,
    durationMinutes
  )
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}
