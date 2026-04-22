import { useState } from 'react'
import { Pencil, Trash2, Plus, BookOpen } from 'lucide-react'
import { useSubjects, useDeleteSubject } from '../../hooks/useSubjects'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { SubjectForm } from './SubjectForm'
import { PageHeader } from '../layout/PageHeader'
import type { Subject } from '../../types'

export function SubjectList() {
  const { data: subjects, isLoading } = useSubjects()
  const deleteSubject = useDeleteSubject()
  const [modal, setModal] = useState<'add' | Subject | null>(null)

  const handleDelete = (id: string) => {
    if (confirm('Delete this subject? Its schedule entries will also be removed.')) {
      deleteSubject.mutate(id)
    }
  }

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage courses and their assigned teachers"
        action={
          <Button onClick={() => setModal('add')}>
            <Plus size={16} /> Add Subject
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
      ) : !subjects?.length ? (
        <EmptyState onAdd={() => setModal('add')} />
      ) : (
        <div className="grid gap-3">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400">
                    {s.teacher ? s.teacher.name : 'No teacher assigned'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setModal(s)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50">
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
        title={modal === 'add' ? 'Add Subject' : 'Edit Subject'}
      >
        <SubjectForm
          subject={modal !== 'add' && modal !== null ? modal : undefined}
          onSuccess={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-56 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
      <BookOpen size={32} className="mb-2" />
      <p className="text-sm mb-3">No subjects yet</p>
      <Button variant="secondary" size="sm" onClick={onAdd}><Plus size={14} /> Add first subject</Button>
    </div>
  )
}
