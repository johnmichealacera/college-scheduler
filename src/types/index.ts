export interface Teacher {
  id: string
  name: string
  created_at: string
}

export interface Subject {
  id: string
  name: string
  teacher_id: string | null
  teacher?: Teacher
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
  subject?: Subject
  teacher?: Teacher
  room?: Room
  created_at: string
}

export interface Conflict {
  type: 'teacher' | 'room'
  message: string
  conflictingEntry: ScheduleEntry
}

export interface TimeSlot {
  start: string
  end: string
}
