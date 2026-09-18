import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { Enrollment } from '../types'

const KEY = 'enrollments'

export function useEnrollments(subjectId: string | null) {
  return useQuery<Enrollment[]>({
    queryKey: [KEY, subjectId],
    enabled: !!subjectId,
    queryFn: () => fetchJson<Enrollment[]>(`/api/subjects/${subjectId}/enrollments`),
  })
}

export function useCreateEnrollment(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) =>
      fetchJson<Enrollment>(`/api/subjects/${subjectId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, subjectId] })
      qc.invalidateQueries({ queryKey: ['subjects'] })
    },
  })
}

export function useDeleteEnrollment(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      fetchJson(`/api/subjects/${subjectId}/enrollments/${enrollmentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, subjectId] })
      qc.invalidateQueries({ queryKey: ['subjects'] })
    },
  })
}
