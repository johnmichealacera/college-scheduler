import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { Student } from '../types'

export function useStudentSearch(query: string, subjectId?: string) {
  const trimmed = query.trim()
  return useQuery<Student[]>({
    queryKey: ['student-search', trimmed, subjectId],
    enabled: trimmed.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams({ q: trimmed })
      if (subjectId) params.set('subjectId', subjectId)
      return fetchJson<Student[]>(`/api/students/search?${params.toString()}`)
    },
  })
}
