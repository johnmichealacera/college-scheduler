import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Teacher } from '../types'

// DB table: instructors  (full_name → mapped to name in app)
const TABLE = 'instructors'
const KEY = 'teachers'

function mapRow(row: { id: string; full_name: string; email: string; created_at: string }): Teacher {
  return { id: row.id, name: row.full_name, email: row.email, created_at: row.created_at }
}

export function useTeachers() {
  return useQuery<Teacher[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLE).select('id, full_name, email, created_at').order('full_name')
      if (error) throw error
      return data.map(mapRow)
    },
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ full_name: name, email })
        .select('id, full_name, email, created_at')
        .single()
      if (error) throw error
      return mapRow(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ full_name: name })
        .eq('id', id)
        .select('id, full_name, email, created_at')
        .single()
      if (error) throw error
      return mapRow(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['subjects'] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}
