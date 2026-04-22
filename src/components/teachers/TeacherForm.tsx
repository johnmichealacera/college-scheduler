import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useCreateTeacher, useUpdateTeacher } from '../../hooks/useTeachers'
import type { Teacher } from '../../types'

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') })
type FormValues = z.infer<typeof schema>

interface TeacherFormProps {
  teacher?: Teacher
  onSuccess: () => void
}

export function TeacherForm({ teacher, onSuccess }: TeacherFormProps) {
  const create = useCreateTeacher()
  const update = useUpdateTeacher()
  const isEdit = !!teacher

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: teacher?.name ?? '' },
  })

  useEffect(() => { reset({ name: teacher?.name ?? '' }) }, [teacher, reset])

  const onSubmit = async ({ name }: FormValues) => {
    if (isEdit) {
      await update.mutateAsync({ id: teacher.id, name })
    } else {
      await create.mutateAsync(name)
    }
    onSuccess()
  }

  const isPending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Teacher Name" placeholder="e.g. Dr. Jane Smith" error={errors.name?.message} {...register('name')} />
      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" loading={isPending}>
          {isEdit ? 'Save Changes' : 'Add Teacher'}
        </Button>
      </div>
    </form>
  )
}
