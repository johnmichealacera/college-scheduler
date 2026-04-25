import { useState } from 'react'
import { Plus, Filter, FileDown } from 'lucide-react'
import { useSchedule, useDeleteScheduleEntry } from '../../hooks/useSchedule'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { useSubjects } from '../../hooks/useSubjects'
import { Button } from '../ui/Button'
import { Combobox } from '../ui/Combobox'
import { MultiCombobox } from '../ui/MultiCombobox'
import { Modal } from '../ui/Modal'
import { WeeklyTimetable } from './WeeklyTimetable'
import { ScheduleForm } from './ScheduleForm'
import { PageHeader } from '../layout/PageHeader'
import type { ScheduleEntry, DayOfWeek } from '../../types'
import { DAYS } from '../../types'

export function SchedulePage() {
  const { data: entries = [], isLoading } = useSchedule()
  const { data: teachers = [] } = useTeachers()
  const { data: rooms = [] } = useRooms()
  const { data: subjects = [] } = useSubjects()
  const deleteEntry = useDeleteScheduleEntry()

  const [modal, setModal] = useState<'add' | ScheduleEntry | null>(null)
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterRooms, setFilterRooms] = useState<string[]>([])
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDays, setFilterDays] = useState<DayOfWeek[]>([])
  const [showVacantInPDF, setShowVacantInPDF] = useState(false)

  const toggleDay = (day: DayOfWeek) =>
    setFilterDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])

  const handleDelete = (id: string) => {
    if (confirm('Remove this schedule entry?')) deleteEntry.mutate(id)
  }

  const conflictCount = entries.filter((e, _, arr) =>
    arr.some(
      (o) =>
        o.id !== e.id &&
        o.day === e.day &&
        ((o.teacher_id === e.teacher_id || o.room_id === e.room_id)) &&
        e.start_time < o.end_time && o.start_time < e.end_time
    )
  ).length

  const teacherOptions = [
    { value: '', label: 'All Teachers' },
    ...teachers.map((t) => ({ value: t.id, label: t.name })),
  ]
  const roomOptions = rooms.map((r) => ({ value: r.id, label: r.name }))
  const subjectOptions = [
    { value: '', label: 'All Subjects' },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ]

  const handleExportPDF = async () => {
    const filtered = entries.filter((e) => {
      if (filterTeacher && e.teacher_id !== filterTeacher) return false
      if (filterRooms.length > 0 && !filterRooms.includes(e.room_id)) return false
      if (filterSubject && e.subject_id !== filterSubject) return false
      return true
    })
    const activeTeacher = teachers.find((t) => t.id === filterTeacher)
    const activeRoomNames =
      filterRooms.length > 0
        ? rooms.filter((r) => filterRooms.includes(r.id)).map((r) => r.name).join(', ')
        : undefined
    const activeSubject = subjects.find((s) => s.id === filterSubject)
    const label = [activeTeacher?.name, activeSubject?.name, activeRoomNames].filter(Boolean).join(', ')

    const pdfRooms = filterRooms.length > 0 ? rooms.filter((r) => filterRooms.includes(r.id)) : rooms

    const { generateSchedulePDF } = await import('../../lib/generateSchedulePDF')
    generateSchedulePDF(filtered, {
      filterLabel: label || undefined,
      showVacant: showVacantInPDF,
      allEntries: entries,
      rooms: pdfRooms,
    })
  }

  const hasActiveFilters = !!(filterTeacher || filterRooms.length || filterSubject || filterDays.length)

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Weekly timetable — click an entry to edit"
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showVacantInPDF}
                onChange={(e) => setShowVacantInPDF(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              Show vacant
            </label>
            <Button variant="secondary" onClick={handleExportPDF} disabled={entries.length === 0}>
              <FileDown size={16} /> Export PDF
            </Button>
            <Button onClick={() => setModal('add')}>
              <Plus size={16} /> Add Class
            </Button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{entries.length}</span> scheduled classes
        </div>
        {conflictCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {conflictCount} conflict{conflictCount > 1 ? 's' : ''} detected
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5 p-4 bg-white rounded-xl border border-gray-200">
        {/* Row 1: Day toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <Filter size={14} className="text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">Days:</span>
          </div>
          {DAYS.map((day) => {
            const active = filterDays.includes(day)
            const short = day.slice(0, 3)
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {short}
              </button>
            )
          })}
        </div>

        {/* Row 2: Other filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-44">
            <Combobox
              placeholder="All Teachers"
              options={teacherOptions}
              value={filterTeacher}
              onChange={(v) => setFilterTeacher(v)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Combobox
              placeholder="All Subjects"
              options={subjectOptions}
              value={filterSubject}
              onChange={(v) => setFilterSubject(v)}
            />
          </div>
          <div className="w-full sm:w-44">
            <MultiCombobox
              placeholder="All Rooms"
              options={roomOptions}
              values={filterRooms}
              onChange={setFilterRooms}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterTeacher(''); setFilterRooms([]); setFilterSubject(''); setFilterDays([]) }}
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading schedule...</div>
      ) : (
        <WeeklyTimetable
          entries={entries}
          onEdit={(e) => setModal(e)}
          onDelete={handleDelete}
          filterTeacherId={filterTeacher || undefined}
          filterRoomIds={filterRooms.length ? filterRooms : undefined}
          filterSubjectId={filterSubject || undefined}
          filterDays={filterDays.length ? filterDays : undefined}
        />
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add Class to Schedule' : 'Edit Schedule Entry'}
        className="max-w-lg"
      >
        <ScheduleForm
          entry={modal !== 'add' && modal !== null ? modal : undefined}
          allEntries={entries}
          onSuccess={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}
