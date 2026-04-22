import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ConflictAlert } from './ConflictAlert'
import { useTeachers } from '../../hooks/useTeachers'
import { useSubjects } from '../../hooks/useSubjects'
import { useRooms } from '../../hooks/useRooms'
import { useCreateScheduleEntry, useUpdateScheduleEntry } from '../../hooks/useSchedule'
import { detectConflicts, suggestAvailableSlots, timeToMinutes } from '../../lib/utils'
import { DAYS } from '../../types'
import type { ScheduleEntry, TimeSlot } from '../../types'

const schema = z.object({
  subject_id: z.string().min(1, 'Please select a subject'),
  teacher_id: z.string().min(1, 'Please select a teacher'),
  room_id: z.string().min(1, 'Please select a room'),
  day: z.string().min(1, 'Please select a day'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
}).refine((d) => d.start_time < d.end_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
})

type FormValues = z.infer<typeof schema>

interface ScheduleFormProps {
  entry?: ScheduleEntry
  allEntries: ScheduleEntry[]
  onSuccess: () => void
  onCancel: () => void
}

export function ScheduleForm({ entry, allEntries, onSuccess, onCancel }: ScheduleFormProps) {
  const { data: teachers } = useTeachers()
  const { data: subjects } = useSubjects()
  const { data: rooms } = useRooms()
  const create = useCreateScheduleEntry()
  const update = useUpdateScheduleEntry()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject_id: entry?.subject_id ?? '',
      teacher_id: entry?.teacher_id ?? '',
      room_id: entry?.room_id ?? '',
      day: entry?.day ?? '',
      start_time: entry?.start_time?.slice(0, 5) ?? '',
      end_time: entry?.end_time?.slice(0, 5) ?? '',
    },
  })

  useEffect(() => {
    if (entry) {
      reset({
        subject_id: entry.subject_id,
        teacher_id: entry.teacher_id,
        room_id: entry.room_id,
        day: entry.day,
        start_time: entry.start_time.slice(0, 5),
        end_time: entry.end_time.slice(0, 5),
      })
    }
  }, [entry, reset])

  // Watch specific fields so conflict recalculates on every relevant keystroke
  const [teacher_id, room_id, day, start_time, end_time] = watch([
    'teacher_id', 'room_id', 'day', 'start_time', 'end_time',
  ])

  // Derived — never stale, recalculates whenever any watched value or allEntries changes
  const conflicts = useMemo(() => {
    if (!teacher_id || !room_id || !day || !start_time || !end_time) return []
    return detectConflicts(
      { teacher_id, room_id, day, start_time, end_time },
      allEntries,
      entry?.id,
    )
  }, [teacher_id, room_id, day, start_time, end_time, allEntries, entry?.id])

  const suggestedSlots = useMemo((): TimeSlot[] => {
    if (!conflicts.length || !day || !teacher_id || !room_id || !start_time || !end_time) return []
    const duration = timeToMinutes(end_time) - timeToMinutes(start_time)
    if (duration <= 0) return []
    return suggestAvailableSlots(allEntries, day, teacher_id, room_id, duration)
  }, [conflicts.length, allEntries, day, teacher_id, room_id, start_time, end_time])

  const handleSelectSlot = (slot: TimeSlot) => {
    setValue('start_time', slot.start, { shouldValidate: true })
    setValue('end_time', slot.end, { shouldValidate: true })
  }

  const onSubmit = async (data: FormValues) => {
    if (conflicts.length) return
    if (entry) {
      await update.mutateAsync({ id: entry.id, ...data })
    } else {
      await create.mutateAsync(data)
    }
    onSuccess()
  }

  const teacherOptions = (teachers ?? []).map((t) => ({ value: t.id, label: t.name }))
  const subjectOptions = (subjects ?? []).map((s) => ({ value: s.id, label: s.name }))
  const roomOptions = (rooms ?? []).map((r) => ({ value: r.id, label: r.name }))
  const dayOptions = DAYS.map((d) => ({ value: d, label: d }))

  const isPending = create.isPending || update.isPending
  const hasConflict = conflicts.length > 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Conflict banner — shown at the top so it's impossible to miss */}
      {hasConflict && (
        <ConflictAlert
          conflicts={conflicts}
          suggestedSlots={suggestedSlots}
          onSelectSlot={handleSelectSlot}
        />
      )}

      <Select label="Subject" placeholder="Select a subject" options={subjectOptions} error={errors.subject_id?.message} {...register('subject_id')} />
      <Select label="Teacher" placeholder="Select a teacher" options={teacherOptions} error={errors.teacher_id?.message} {...register('teacher_id')} />
      <Select
        label="Room"
        placeholder="Select a room"
        options={roomOptions}
        error={errors.room_id?.message}
        className={hasConflict && conflicts.some(c => c.type === 'room') ? 'border-red-500 ring-1 ring-red-400' : ''}
        {...register('room_id')}
      />
      <Select label="Day" placeholder="Select a day" options={dayOptions} error={errors.day?.message} {...register('day')} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time"
          type="time"
          error={errors.start_time?.message}
          className={hasConflict ? 'border-red-400' : ''}
          {...register('start_time')}
        />
        <Input
          label="End Time"
          type="time"
          error={errors.end_time?.message}
          className={hasConflict ? 'border-red-400' : ''}
          {...register('end_time')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          type="submit"
          loading={isPending}
          disabled={hasConflict}
          className={hasConflict ? 'opacity-50 cursor-not-allowed' : ''}
          title={hasConflict ? 'Resolve conflicts before saving' : undefined}
        >
          {entry ? 'Save Changes' : 'Add to Schedule'}
        </Button>
      </div>
    </form>
  )
}
