import {
  LANGUAGE_LABELS,
  LEVEL_LABELS,
  type DayOfWeek,
  type DspcScheduleEntry,
  type LanguageOption,
  type LevelOption,
  type ScheduleEntry,
} from '../types'

export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatEventDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatEventDateShort(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function weekdayFromIso(iso: string): DayOfWeek {
  return parseLocalDate(iso).toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek
}

export function contestSlotLabel(entry: DspcScheduleEntry): string {
  return `${entry.contest} · ${LANGUAGE_LABELS[entry.language]} · ${LEVEL_LABELS[entry.level]}`
}

export function shortLevel(level: LevelOption): string {
  switch (level) {
    case 'ELEMENTARY':
      return 'Elem'
    case 'SECONDARY':
      return 'Sec'
    default: {
      const _exhaustive: never = level
      return _exhaustive
    }
  }
}

export function shortLanguage(language: LanguageOption): string {
  switch (language) {
    case 'ENGLISH':
      return 'Eng'
    case 'FILIPINO':
      return 'Fil'
    default: {
      const _exhaustive: never = language
      return _exhaustive
    }
  }
}

export function dspcToScheduleEntry(entry: DspcScheduleEntry): ScheduleEntry {
  const title = contestSlotLabel(entry)
  return {
    id: entry.id,
    subject_id: entry.contest,
    teacher_id: entry.facilitator_id,
    room_id: entry.room_id,
    day: weekdayFromIso(entry.event_date),
    event_date: entry.event_date.slice(0, 10),
    start_time: entry.start_time,
    end_time: entry.end_time,
    subject: { id: entry.contest, name: title, teacher_id: null, created_at: entry.created_at },
    teacher: entry.facilitator,
    room: entry.room,
    created_at: entry.created_at,
  }
}
