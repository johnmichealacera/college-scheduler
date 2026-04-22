import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useCreateSubject, useUpdateSubject } from '../../hooks/useSubjects'
import { useTeachers } from '../../hooks/useTeachers'
import type { Subject } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  teacher_id: z.string().nullable(),
})
type FormValues = z.infer<typeof schema>

export function SubjectForm({ subject, onSuccess }: { subject?: Subject; onSuccess: () => void }) {
  const create = useCreateSubject()
  const update = useUpdateSubject()
  const { data: teachers } = useTeachers()
  const isEdit = !!subject

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: subject?.name ?? '', teacher_id: subject?.teacher_id ?? null },
  })

  useEffect(() => {
    reset({ name: subject?.name ?? '', teacher_id: subject?.teacher_id ?? null })
  }, [subject, reset])

  const onSubmit = async ({ name, teacher_id }: FormValues) => {
    if (isEdit) {
      await update.mutateAsync({ id: subject.id, name, teacher_id: teacher_id || null })
    } else {
      await create.mutateAsync({ name, teacher_id: teacher_id || null })
    }
    onSuccess()
  }

  const teacherOptions = (teachers ?? []).map((t) => ({ value: t.id, label: t.name }))
  const isPending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Subject Name" placeholder="e.g. Mathematics" error={errors.name?.message} {...register('name')} />
      <Select
        label="Assigned Teacher (optional)"
        placeholder="No teacher assigned"
        options={teacherOptions}
        {...register('teacher_id')}
      />
      <div className="flex justify-end pt-1">
        <Button type="submit" loading={isPending}>
          {isEdit ? 'Save Changes' : 'Add Subject'}
        </Button>
      </div>
    </form>
  )
}
