import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { Subject } from '../types'

// API route: /api/subjects  (instructorId → mapped to teacher_id in app)
const KEY = 'subjects'

type DbSubject = {
  id: string
  name: string
  instructorId: string | null
  createdAt: string
  instructor: { id: string; fullName: string; createdAt: string } | null
}

function mapRow(row: DbSubject): Subject {
  return {
    id: row.id,
    name: row.name,
    teacher_id: row.instructorId,
    teacher: row.instructor
      ? { id: row.instructor.id, name: row.instructor.fullName, created_at: row.instructor.createdAt }
      : undefined,
    created_at: row.createdAt,
  }
}

export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const rows = await fetchJson<DbSubject[]>('/api/subjects')
      return rows.map(mapRow)
    },
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, teacher_id }: { name: string; teacher_id: string | null }) => {
      const row = await fetchJson<DbSubject>('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, instructorId: teacher_id }),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, teacher_id }: { id: string; name: string; teacher_id: string | null }) => {
      const row = await fetchJson<DbSubject>(`/api/subjects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, instructorId: teacher_id }),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchJson(`/api/subjects/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}
