import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { ScheduleEntry } from '../types'

// API route: /api/students/[studentId]/schedule — returns the exact same
// row shape as /api/class-schedule, so this mirrors useSchedule.ts's mapRow.
type DbEntry = {
  id: string
  subjectId: string
  teacherId: string
  roomId: string
  day: string
  startTime: string
  endTime: string
  createdAt: string
  subject: { id: string; name: string; instructorId: string | null; maxCapacity: number; createdAt: string } | null
  teacher: { id: string; fullName: string; createdAt: string } | null
  room: { id: string; name: string; createdAt: string } | null
}

function mapRow(row: DbEntry): ScheduleEntry {
  return {
    id: row.id,
    subject_id: row.subjectId,
    teacher_id: row.teacherId,
    room_id: row.roomId,
    day: row.day as ScheduleEntry['day'],
    start_time: row.startTime,
    end_time: row.endTime,
    created_at: row.createdAt,
    subject: row.subject
      ? {
          id: row.subject.id,
          name: row.subject.name,
          teacher_id: row.subject.instructorId,
          max_capacity: row.subject.maxCapacity,
          created_at: row.subject.createdAt,
        }
      : undefined,
    teacher: row.teacher
      ? { id: row.teacher.id, name: row.teacher.fullName, created_at: row.teacher.createdAt }
      : undefined,
    room: row.room ? { id: row.room.id, name: row.room.name, created_at: row.room.createdAt } : undefined,
  }
}

export function useStudentSchedule(studentId: string | null) {
  return useQuery<ScheduleEntry[]>({
    queryKey: ['student-schedule', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const rows = await fetchJson<DbEntry[]>(`/api/students/${studentId}/schedule`)
      return rows.map(mapRow)
    },
  })
}
