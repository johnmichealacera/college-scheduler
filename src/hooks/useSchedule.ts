import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ScheduleEntry } from '../types'

// DB table: class_schedule  (teacher FK → instructors.full_name mapped to name)
const TABLE = 'class_schedule'
const KEY = 'schedule'

const SELECT = `
  *,
  subject:subjects(id, name, instructor_id, created_at),
  teacher:instructors(id, full_name, created_at),
  room:rooms(id, name, created_at)
`

type DbEntry = Omit<ScheduleEntry, 'teacher'> & {
  teacher: { id: string; full_name: string; created_at: string } | null
}

function mapRow(row: DbEntry): ScheduleEntry {
  return {
    ...row,
    teacher: row.teacher
      ? { id: row.teacher.id, name: row.teacher.full_name, created_at: row.teacher.created_at }
      : undefined,
  }
}

export function useSchedule() {
  return useQuery<ScheduleEntry[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLE).select(SELECT).order('day').order('start_time')
      if (error) throw error
      return (data as DbEntry[]).map(mapRow)
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

export function useCreateScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload) => {
      const { data, error } = await supabase.from(TABLE).insert(payload).select(SELECT).single()
      if (error) throw error
      return mapRow(data as DbEntry)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: CreateSchedulePayload & { id: string }) => {
      const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select(SELECT).single()
      if (error) throw error
      return mapRow(data as DbEntry)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
