import { useState } from 'react'
import { Pencil, Trash2, Plus, Users } from 'lucide-react'
import { useTeachers, useDeleteTeacher } from '../../hooks/useTeachers'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { TeacherForm } from './TeacherForm'
import { PageHeader } from '../layout/PageHeader'
import type { Teacher } from '../../types'

export function TeacherList() {
  const { data: teachers, isLoading } = useTeachers()
  const deleteTeacher = useDeleteTeacher()
  const [modal, setModal] = useState<'add' | Teacher | null>(null)

  const handleDelete = (id: string) => {
    if (confirm('Delete this teacher? Their schedule entries will also be removed.')) {
      deleteTeacher.mutate(id)
    }
  }

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage teaching staff"
        action={
          <Button onClick={() => setModal('add')}>
            <Plus size={16} /> Add Teacher
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
      ) : !teachers?.length ? (
        <EmptyState onAdd={() => setModal('add')} />
      ) : (
        <div className="grid gap-3">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{t.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setModal(t)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add Teacher' : 'Edit Teacher'}
      >
        <TeacherForm
          teacher={modal !== 'add' && modal !== null ? modal : undefined}
          onSuccess={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-56 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
      <Users size={32} className="mb-2" />
      <p className="text-sm mb-3">No teachers yet</p>
      <Button variant="secondary" size="sm" onClick={onAdd}><Plus size={14} /> Add first teacher</Button>
    </div>
  )
}
