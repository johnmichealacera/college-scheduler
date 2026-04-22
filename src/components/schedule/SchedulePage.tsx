import { useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import { useSchedule, useDeleteScheduleEntry } from '../../hooks/useSchedule'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { WeeklyTimetable } from './WeeklyTimetable'
import { ScheduleForm } from './ScheduleForm'
import { PageHeader } from '../layout/PageHeader'
import type { ScheduleEntry } from '../../types'

export function SchedulePage() {
  const { data: entries = [], isLoading } = useSchedule()
  const { data: teachers = [] } = useTeachers()
  const { data: rooms = [] } = useRooms()
  const deleteEntry = useDeleteScheduleEntry()

  const [modal, setModal] = useState<'add' | ScheduleEntry | null>(null)
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterRoom, setFilterRoom] = useState('')

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

  const teacherOptions = teachers.map((t) => ({ value: t.id, label: t.name }))
  const roomOptions = rooms.map((r) => ({ value: r.id, label: r.name }))

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Weekly timetable — click an entry to edit"
        action={
          <Button onClick={() => setModal('add')}>
            <Plus size={16} /> Add Class
          </Button>
        }
      />

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-5">
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
      <div className="flex items-center gap-3 mb-5 p-4 bg-white rounded-xl border border-gray-200">
        <Filter size={14} className="text-gray-400" />
        <span className="text-sm text-gray-500 font-medium">Filter by:</span>
        <div className="w-48">
          <Select
            placeholder="All Teachers"
            options={teacherOptions}
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            placeholder="All Rooms"
            options={roomOptions}
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          />
        </div>
        {(filterTeacher || filterRoom) && (
          <button
            onClick={() => { setFilterTeacher(''); setFilterRoom('') }}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading schedule...</div>
      ) : (
        <WeeklyTimetable
          entries={entries}
          onEdit={(e) => setModal(e)}
          onDelete={handleDelete}
          filterTeacherId={filterTeacher || undefined}
          filterRoomId={filterRoom || undefined}
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
