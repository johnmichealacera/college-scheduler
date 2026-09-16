import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { Teacher } from '../types'

// API route: /api/instructors  (fullName → mapped to name in app)
const KEY = 'teachers'

type DbInstructor = { id: string; fullName: string; email: string | null; createdAt: string }

function mapRow(row: DbInstructor): Teacher {
  return { id: row.id, name: row.fullName, email: row.email ?? undefined, created_at: row.createdAt }
}

export function useTeachers() {
  return useQuery<Teacher[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const rows = await fetchJson<DbInstructor[]>('/api/instructors')
      return rows.map(mapRow)
    },
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      const row = await fetchJson<DbInstructor>('/api/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email }),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const row = await fetchJson<DbInstructor>(`/api/instructors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name }),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchJson(`/api/instructors/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['subjects'] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
      qc.invalidateQueries({ queryKey: ['dspc-schedule'] })
    },
  })
}
