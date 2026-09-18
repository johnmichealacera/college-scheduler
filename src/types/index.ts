export interface Teacher {
  id: string
  name: string
  email?: string
  created_at: string
}

export interface Subject {
  id: string
  name: string
  teacher_id: string | null
  teacher?: Teacher
  max_capacity: number
  enrolled_count?: number
  created_at: string
}

export interface Room {
  id: string
  name: string
  created_at: string
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export interface ScheduleEntry {
  id: string
  subject_id: string
  teacher_id: string
  room_id: string
  day: DayOfWeek
  start_time: string
  end_time: string
  event_date?: string
  subject?: Subject
  teacher?: Teacher
  room?: Room
  created_at: string
}

export interface Conflict {
  type: 'teacher' | 'room' | 'facilitator' | 'student'
  message: string
  conflictingEntry: ScheduleEntry
}

export interface Student {
  id: string
  student_id: string
  name: string
  email: string
  course: string
  year_level: string
  already_enrolled?: boolean
}

export interface Enrollment {
  id: string
  subject_id: string
  student_id: string
  enrolled_at: string
  student?: Student
  orphaned?: boolean
}

export interface TimeSlot {
  start: string
  end: string
}

export type ScheduleView = 'school' | 'dspc'

export const CONTEST_CATEGORIES = [
  'News Writing',
  'Editorial Writing',
  'Editorial Cartooning',
  'Feature Writing',
  'Sci and Tech Writing',
  'Sports Writing',
  'Copyreading and Headline Writing',
  'Photojournalism',
  'Radio Broadcasting',
  'CDP',
  'Online Desktop',
  'TV Broadcasting',
  'Column Writing',
] as const

export type ContestCategory = (typeof CONTEST_CATEGORIES)[number]

export const DEFAULT_DIVISION = 'Division of Siargao'

export const LEVEL_OPTIONS = ['ELEMENTARY', 'SECONDARY'] as const
export type LevelOption = (typeof LEVEL_OPTIONS)[number]

export const LEVEL_LABELS: Record<LevelOption, string> = {
  ELEMENTARY: 'Elementary',
  SECONDARY: 'Secondary',
}

export const LANGUAGE_OPTIONS = ['ENGLISH', 'FILIPINO'] as const
export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number]

export const LANGUAGE_LABELS: Record<LanguageOption, string> = {
  ENGLISH: 'English',
  FILIPINO: 'Filipino',
}

export const DSPC_FACILITATOR_TBA = 'TBA'
export const DSPC_FACILITATOR_TBA_LABEL = 'TBA (still to be arranged)'

export interface DspcScheduleEntry {
  id: string
  contest: ContestCategory
  language: LanguageOption
  level: LevelOption
  facilitator_id: string | null
  room_id: string
  event_date: string
  start_time: string
  end_time: string
  facilitator?: Teacher
  room?: Room
  created_at: string
}
