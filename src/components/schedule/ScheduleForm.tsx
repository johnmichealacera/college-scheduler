import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Combobox } from '../ui/Combobox'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ConflictAlert } from './ConflictAlert'
import { useTeachers } from '../../hooks/useTeachers'
import { useSubjects } from '../../hooks/useSubjects'
import { useRooms } from '../../hooks/useRooms'
import { useCreateScheduleEntry, useUpdateScheduleEntry } from '../../hooks/useSchedule'
import { cn, detectConflicts, suggestAvailableSlots, timeToMinutes } from '../../lib/utils'
import { DAYS } from '../../types'
import type { ScheduleEntry, TimeSlot } from '../../types'

const TIME_MIN = '07:00'
const TIME_MAX = '21:00'

const schema = z.object({
  subject_id: z.string().min(1, 'Please select a subject'),
  teacher_id: z.string().min(1, 'Please select a teacher'),
  room_id: z.string().min(1, 'Please select a room'),
  days: z.array(z.string()).min(1, 'Please select at least one day'),
  start_time: z.string()
    .min(1, 'Start time is required')
    .refine((t) => t >= TIME_MIN && t < TIME_MAX, 'Start time must be between 7:00 AM and 9:00 PM'),
  end_time: z.string()
    .min(1, 'End time is required')
    .refine((t) => t > TIME_MIN && t <= TIME_MAX, 'End time must be between 7:00 AM and 9:00 PM'),
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

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject_id: entry?.subject_id ?? '',
      teacher_id: entry?.teacher_id ?? '',
      room_id: entry?.room_id ?? '',
      days: entry?.day ? [entry.day] : [],
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
        days: [entry.day],
        start_time: entry.start_time.slice(0, 5),
        end_time: entry.end_time.slice(0, 5),
      })
    }
  }, [entry, reset])

  const [teacher_id, room_id, watchedDays, start_time, end_time] = watch([
    'teacher_id', 'room_id', 'days', 'start_time', 'end_time',
  ])

  const selectedDays = watchedDays ?? []

  const toggleDay = (day: string) => {
    if (entry) {
      // Edit mode: radio behavior — only one day at a time
      setValue('days', [day], { shouldValidate: true })
    } else {
      // Add mode: checkbox behavior — toggle individual days
      const updated = selectedDays.includes(day)
        ? selectedDays.filter((d) => d !== day)
        : [...selectedDays, day]
      setValue('days', updated, { shouldValidate: true })
    }
  }

  const conflicts = useMemo(() => {
    if (!teacher_id || !room_id || !selectedDays.length || !start_time || !end_time) return []
    const multiDay = selectedDays.length > 1
    return selectedDays.flatMap((day) => {
      const dayConflicts = detectConflicts(
        { teacher_id, room_id, day, start_time, end_time },
        allEntries,
        entry?.id,
      )
      if (!multiDay) return dayConflicts
      return dayConflicts.map((c) => ({ ...c, message: `${day}: ${c.message}` }))
    })
  }, [teacher_id, room_id, selectedDays, start_time, end_time, allEntries, entry?.id])

  const suggestedSlots = useMemo((): TimeSlot[] => {
    if (!conflicts.length || !teacher_id || !room_id || !start_time || !end_time) return []
    const duration = timeToMinutes(end_time) - timeToMinutes(start_time)
    if (duration <= 0) return []
    const firstConflictDay = selectedDays.find(
      (day) => detectConflicts({ teacher_id, room_id, day, start_time, end_time }, allEntries, entry?.id).length > 0
    )
    if (!firstConflictDay) return []
    return suggestAvailableSlots(allEntries, firstConflictDay, teacher_id, room_id, duration)
  }, [conflicts.length, allEntries, selectedDays, teacher_id, room_id, start_time, end_time, entry?.id])

  const handleSelectSlot = (slot: TimeSlot) => {
    setValue('start_time', slot.start, { shouldValidate: true })
    setValue('end_time', slot.end, { shouldValidate: true })
  }

  const onSubmit = async (data: FormValues) => {
    if (conflicts.length) return
    const { days, ...rest } = data
    if (entry) {
      await update.mutateAsync({ id: entry.id, ...rest, day: days[0] })
    } else {
      await Promise.all(days.map((day) => create.mutateAsync({ ...rest, day })))
    }
    onSuccess()
  }

  const teacherOptions = (teachers ?? []).map((t) => ({ value: t.id, label: t.name }))
  const subjectOptions = (subjects ?? []).map((s) => ({ value: s.id, label: s.name }))
  const roomOptions = (rooms ?? []).map((r) => ({ value: r.id, label: r.name }))


  const isPending = create.isPending || update.isPending
  const hasConflict = conflicts.length > 0
  const daysError = (errors.days as { message?: string } | undefined)?.message

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

      <Controller
        name="subject_id"
        control={control}
        render={({ field }) => (
          <Combobox
            label="Subject"
            placeholder="Select a subject"
            options={subjectOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.subject_id?.message}
          />
        )}
      />
      <Controller
        name="teacher_id"
        control={control}
        render={({ field }) => (
          <Combobox
            label="Teacher"
            placeholder="Select a teacher"
            options={teacherOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.teacher_id?.message}
          />
        )}
      />
      <Controller
        name="room_id"
        control={control}
        render={({ field }) => (
          <Combobox
            label="Room"
            placeholder="Select a room"
            options={roomOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.room_id?.message}
            className={hasConflict && conflicts.some(c => c.type === 'room') ? 'border-red-500 ring-1 ring-red-400' : ''}
          />
        )}
      />

      {/* Day picker — single selection in edit mode, multi-select in add mode */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">
          {entry ? 'Day' : 'Day(s)'}
          {!entry && <span className="ml-1 text-xs font-normal text-gray-400">(select one or more)</span>}
        </span>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                selectedDays.includes(day)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              )}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        {daysError && <p className="text-xs text-red-600">{daysError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Time</span>
          <span className="text-xs text-gray-400">Philippine Standard Time (GMT+8)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start"
            type="time"
            min={TIME_MIN}
            max="20:59"
            error={errors.start_time?.message}
            className={hasConflict ? 'border-red-400' : ''}
            {...register('start_time')}
          />
          <Input
            label="End"
            type="time"
            min="07:01"
            max={TIME_MAX}
            error={errors.end_time?.message}
            className={hasConflict ? 'border-red-400' : ''}
            {...register('end_time')}
          />
        </div>
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
          {entry ? 'Save Changes' : `Add to Schedule${selectedDays.length > 1 ? ` (${selectedDays.length} days)` : ''}`}
        </Button>
      </div>
    </form>
  )
}
