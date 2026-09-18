'use client'

import { useEffect, useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { ConflictAlert } from '../schedule/ConflictAlert'
import { useSchedule } from '../../hooks/useSchedule'
import { useStudentSearch } from '../../hooks/useStudentSearch'
import { useStudentSchedule } from '../../hooks/useStudentSchedule'
import { useEnrollments, useCreateEnrollment, useDeleteEnrollment } from '../../hooks/useEnrollments'
import { cn, detectStudentConflicts } from '../../lib/utils'
import type { Student, Subject } from '../../types'

function parseErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback
  try {
    const parsed = JSON.parse(error.message)
    return typeof parsed?.error === 'string' ? parsed.error : error.message
  } catch {
    return error.message
  }
}

export function RosterModal({ subject }: { subject: Subject }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [candidate, setCandidate] = useState<Student | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results = [], isFetching: searching } = useStudentSearch(debouncedQuery, subject.id)
  const { data: entries = [] } = useSchedule()
  const { data: roster = [], isLoading: rosterLoading } = useEnrollments(subject.id)
  const { data: candidateSchedule = [] } = useStudentSchedule(candidate?.id ?? null)
  const createEnrollment = useCreateEnrollment(subject.id)
  const deleteEnrollment = useDeleteEnrollment(subject.id)

  const subjectEntries = useMemo(
    () => entries.filter((e) => e.subject_id === subject.id),
    [entries, subject.id]
  )

  const conflicts = useMemo(() => {
    if (!candidate) return []
    return detectStudentConflicts(subjectEntries, candidateSchedule)
  }, [candidate, subjectEntries, candidateSchedule])

  const enrolledCount = subject.enrolled_count ?? roster.length
  const atCapacity = enrolledCount >= subject.max_capacity
  const canAdd = !!candidate && !candidate.already_enrolled && conflicts.length === 0 && !atCapacity

  const handleSelect = (student: Student) => {
    setCandidate(student)
    setQuery(`${student.name} (${student.student_id})`)
    setError(null)
  }

  const handleAdd = async () => {
    if (!candidate) return
    setError(null)
    try {
      await createEnrollment.mutateAsync(candidate.id)
      setCandidate(null)
      setQuery('')
    } catch (err) {
      setError(parseErrorMessage(err, 'Could not add this student.'))
    }
  }

  const handleRemove = (enrollmentId: string) => {
    if (confirm('Remove this student from the roster?')) {
      deleteEnrollment.mutate(enrollmentId)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Roster</span>
        <span className={cn('font-semibold', atCapacity ? 'text-red-600' : 'text-gray-900')}>
          {enrolledCount} / {subject.max_capacity} enrolled
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search student by name or ID..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCandidate(null)
            setError(null)
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {debouncedQuery && !candidate && (
          <div className="absolute left-0 right-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {searching ? (
              <p className="px-3 py-2.5 text-sm text-gray-400">Searching...</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-gray-400">No students found.</p>
            ) : (
              results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={s.already_enrolled}
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-gray-400"> · {s.student_id} · {s.course} {s.year_level}</span>
                  </span>
                  {s.already_enrolled && <span className="text-xs text-gray-400 shrink-0">Enrolled</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {candidate && conflicts.length > 0 && <ConflictAlert conflicts={conflicts} />}
      {candidate && !conflicts.length && atCapacity && (
        <p className="text-sm text-red-600">This subject is at full capacity.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {candidate && (
        <Button onClick={handleAdd} disabled={!canAdd} loading={createEnrollment.isPending}>
          <UserPlus size={16} /> Add to Roster
        </Button>
      )}

      <div className="border-t border-gray-100 pt-3">
        {rosterLoading ? (
          <p className="text-sm text-gray-400">Loading roster...</p>
        ) : roster.length === 0 ? (
          <p className="text-sm text-gray-400">No students enrolled yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {roster.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                {e.orphaned || !e.student ? (
                  <span className="text-gray-400 italic">Removed / unknown student</span>
                ) : (
                  <span className="truncate">
                    <span className="font-medium text-gray-900">{e.student.name}</span>
                    <span className="text-gray-400"> · {e.student.student_id} · {e.student.course} {e.student.year_level}</span>
                  </span>
                )}
                <button
                  onClick={() => handleRemove(e.id)}
                  className="shrink-0 text-gray-400 hover:text-red-600 p-1 rounded"
                  aria-label="Remove from roster"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
