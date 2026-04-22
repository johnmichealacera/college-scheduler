import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Subject } from '../types'

// DB table: subjects  (instructor_id → mapped to teacher_id in app)
const TABLE = 'subjects'
const KEY = 'subjects'

type DbSubject = {
  id: string
  name: string
  instructor_id: string | null
  created_at: string
  instructor: { id: string; full_name: string; created_at: string } | null
}

function mapRow(row: DbSubject): Subject {
  return {
    id: row.id,
    name: row.name,
    teacher_id: row.instructor_id,
    teacher: row.instructor ? { id: row.instructor.id, name: row.instructor.full_name, created_at: row.instructor.created_at } : undefined,
    created_at: row.created_at,
  }
}

export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, instructor_id, created_at, instructor:instructors(id, full_name, created_at)')
        .order('name')
      if (error) throw error
      return (data as unknown as DbSubject[]).map(mapRow)
    },
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, teacher_id }: { name: string; teacher_id: string | null }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ name, instructor_id: teacher_id, max_capacity: 40 })
        .select('id, name, instructor_id, created_at')
        .single()
      if (error) throw error
      return mapRow({ ...data, instructor: null })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, teacher_id }: { id: string; name: string; teacher_id: string | null }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ name, instructor_id: teacher_id })
        .eq('id', id)
        .select('id, name, instructor_id, created_at')
        .single()
      if (error) throw error
      return mapRow({ ...data, instructor: null })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}
