import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useCreateRoom, useUpdateRoom } from '../../hooks/useRooms'
import type { Room } from '../../types'

const schema = z.object({ name: z.string().min(1, 'Room name is required') })
type FormValues = z.infer<typeof schema>

export function RoomForm({ room, onSuccess }: { room?: Room; onSuccess: () => void }) {
  const create = useCreateRoom()
  const update = useUpdateRoom()
  const isEdit = !!room

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: room?.name ?? '' },
  })

  useEffect(() => { reset({ name: room?.name ?? '' }) }, [room, reset])

  const onSubmit = async ({ name }: FormValues) => {
    if (isEdit) {
      await update.mutateAsync({ id: room.id, name })
    } else {
      await create.mutateAsync(name)
    }
    onSuccess()
  }

  const isPending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Room Name" placeholder="e.g. Room 101, Lab A" error={errors.name?.message} {...register('name')} />
      <div className="flex justify-end pt-1">
        <Button type="submit" loading={isPending}>
          {isEdit ? 'Save Changes' : 'Add Room'}
        </Button>
      </div>
    </form>
  )
}
