import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { ScheduleEntry } from '../types'

// API route: /api/class-schedule  (teacher FK → instructor.fullName mapped to name)
const KEY = 'schedule'

type DbEntry = {
  id: string
  subjectId: string
  teacherId: string
  roomId: string
  day: string
  startTime: string
  endTime: string
  createdAt: string
  subject: { id: string; name: string; instructorId: string | null; createdAt: string } | null
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
      ? { id: row.subject.id, name: row.subject.name, teacher_id: row.subject.instructorId, created_at: row.subject.createdAt }
      : undefined,
    teacher: row.teacher
      ? { id: row.teacher.id, name: row.teacher.fullName, created_at: row.teacher.createdAt }
      : undefined,
    room: row.room ? { id: row.room.id, name: row.room.name, created_at: row.room.createdAt } : undefined,
  }
}

export function useSchedule() {
  return useQuery<ScheduleEntry[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const rows = await fetchJson<DbEntry[]>('/api/class-schedule')
      return rows.map(mapRow)
    },
  })
}

export interface CreateSchedulePayload {
  subject_id: string
  teacher_id: string
  room_id: string
  day: string
  start_time: string
  end_time: string
}

function toApiBody(payload: CreateSchedulePayload) {
  return {
    subjectId: payload.subject_id,
    teacherId: payload.teacher_id,
    roomId: payload.room_id,
    day: payload.day,
    startTime: payload.start_time,
    endTime: payload.end_time,
  }
}

export function useCreateScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload) => {
      const row = await fetchJson<DbEntry>('/api/class-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiBody(payload)),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: CreateSchedulePayload & { id: string }) => {
      const row = await fetchJson<DbEntry>(`/api/class-schedule/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiBody(payload)),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchJson(`/api/class-schedule/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
