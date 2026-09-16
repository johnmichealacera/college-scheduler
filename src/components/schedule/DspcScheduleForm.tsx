'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { Combobox } from '../ui/Combobox'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ConflictAlert } from './ConflictAlert'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { useCreateDspcScheduleEntry, useUpdateDspcScheduleEntry } from '../../hooks/useDspcSchedule'
import { cn, detectDspcConflicts, suggestDspcSlots, timeToMinutes } from '../../lib/utils'
import { formatEventDate, facilitatorFormValue, toIsoDate, toStoredFacilitatorId } from '../../lib/dspc'
import {
  CONTEST_CATEGORIES,
  DSPC_FACILITATOR_TBA,
  DSPC_FACILITATOR_TBA_LABEL,
  LANGUAGE_LABELS,
  LANGUAGE_OPTIONS,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
} from '../../types'
import type { DspcScheduleEntry, TimeSlot } from '../../types'

const TIME_MIN = '07:00'
const TIME_MAX = '21:00'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const schema = z.object({
  contest: z.enum(CONTEST_CATEGORIES),
  language: z.enum(LANGUAGE_OPTIONS),
  level: z.enum(LEVEL_OPTIONS),
  facilitator_id: z.string(),
  room_id: z.string().min(1, 'Please select a venue'),
  dates: z.array(z.string().regex(ISO_DATE, 'Pick a valid date')).min(1, 'Please pick at least one date'),
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

interface DspcScheduleFormProps {
  entry?: DspcScheduleEntry
  allEntries: DspcScheduleEntry[]
  onSuccess: () => void
  onCancel: () => void
}

export function DspcScheduleForm({ entry, allEntries, onSuccess, onCancel }: DspcScheduleFormProps) {
  const { data: teachers } = useTeachers()
  const { data: rooms } = useRooms()
  const create = useCreateDspcScheduleEntry()
  const update = useUpdateDspcScheduleEntry()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contest: entry?.contest ?? CONTEST_CATEGORIES[0],
      language: entry?.language ?? 'ENGLISH',
      level: entry?.level ?? 'SECONDARY',
      facilitator_id: facilitatorFormValue(entry?.facilitator_id),
      room_id: entry?.room_id ?? '',
      dates: entry?.event_date ? [entry.event_date.slice(0, 10)] : [toIsoDate(new Date())],
      start_time: entry?.start_time?.slice(0, 5) ?? '',
      end_time: entry?.end_time?.slice(0, 5) ?? '',
    },
  })

  useEffect(() => {
    if (entry) {
      reset({
        contest: entry.contest,
        language: entry.language,
        level: entry.level,
        facilitator_id: facilitatorFormValue(entry.facilitator_id),
        room_id: entry.room_id,
        dates: [entry.event_date.slice(0, 10)],
        start_time: entry.start_time.slice(0, 5),
        end_time: entry.end_time.slice(0, 5),
      })
    }
  }, [entry, reset])

  const [facilitator_id, room_id, watchedDates, start_time, end_time] = watch([
    'facilitator_id', 'room_id', 'dates', 'start_time', 'end_time',
  ])

  const selectedDates = watchedDates ?? []

  const conflicts = useMemo(() => {
    if (!room_id || !selectedDates.length || !start_time || !end_time) return []
    const storedFacilitatorId = toStoredFacilitatorId(facilitator_id)
    const multiDate = selectedDates.length > 1
    return selectedDates.flatMap((event_date) => {
      if (!ISO_DATE.test(event_date)) return []
      const dayConflicts = detectDspcConflicts(
        { facilitator_id: storedFacilitatorId, room_id, event_date, start_time, end_time },
        allEntries,
        entry?.id,
      )
      if (!multiDate) return dayConflicts
      return dayConflicts.map((c) => ({ ...c, message: `${formatEventDate(event_date)}: ${c.message}` }))
    })
  }, [facilitator_id, room_id, selectedDates, start_time, end_time, allEntries, entry?.id])

  const suggestedSlots = useMemo((): TimeSlot[] => {
    if (!conflicts.length || !room_id || !start_time || !end_time) return []
    const duration = timeToMinutes(end_time) - timeToMinutes(start_time)
    if (duration <= 0) return []
    const storedFacilitatorId = toStoredFacilitatorId(facilitator_id)
    const firstConflictDate = selectedDates.find(
      (event_date) =>
        ISO_DATE.test(event_date) &&
        detectDspcConflicts(
          { facilitator_id: storedFacilitatorId, room_id, event_date, start_time, end_time },
          allEntries,
          entry?.id,
        ).length > 0
    )
    if (!firstConflictDate) return []
    return suggestDspcSlots(allEntries, firstConflictDate, storedFacilitatorId, room_id, duration)
  }, [conflicts.length, allEntries, selectedDates, facilitator_id, room_id, start_time, end_time, entry?.id])

  const handleSelectSlot = (slot: TimeSlot) => {
    setValue('start_time', slot.start, { shouldValidate: true })
    setValue('end_time', slot.end, { shouldValidate: true })
  }

  const onSubmit = async (data: FormValues) => {
    if (conflicts.length) return
    setSubmitError(null)
    const { dates, facilitator_id, ...rest } = data
    const payload = { ...rest, facilitator_id: toStoredFacilitatorId(facilitator_id) }
    try {
      if (entry) {
        await update.mutateAsync({ id: entry.id, ...payload, event_date: dates[0] })
      } else {
        await Promise.all(dates.map((event_date) => create.mutateAsync({ ...payload, event_date })))
      }
      onSuccess()
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Could not save this contest slot.'
      setSubmitError(message)
    }
  }

  const contestOptions = CONTEST_CATEGORIES.map((c) => ({ value: c, label: c }))
  const facilitatorOptions = [
    { value: DSPC_FACILITATOR_TBA, label: DSPC_FACILITATOR_TBA_LABEL },
    ...(teachers ?? []).map((t) => ({ value: t.id, label: t.name })),
  ]
  const roomOptions = (rooms ?? []).map((r) => ({ value: r.id, label: r.name }))

  const isPending = create.isPending || update.isPending
  const hasConflict = conflicts.length > 0
  const datesError = (errors.dates as { message?: string } | undefined)?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {submitError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {submitError}
        </div>
      )}
      {hasConflict && (
        <ConflictAlert
          conflicts={conflicts}
          suggestedSlots={suggestedSlots}
          onSelectSlot={handleSelectSlot}
        />
      )}

      <Controller
        name="contest"
        control={control}
        render={({ field }) => (
          <Combobox
            label="Contest"
            placeholder="Select a contest"
            options={contestOptions}
            value={field.value ?? ''}
            onChange={field.onChange}
            error={errors.contest?.message}
          />
        )}
      />

      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <ChipPicker
            label="Language"
            options={LANGUAGE_OPTIONS.map((value) => ({ value, label: LANGUAGE_LABELS[value] }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        name="level"
        control={control}
        render={({ field }) => (
          <ChipPicker
            label="Level"
            options={LEVEL_OPTIONS.map((value) => ({ value, label: LEVEL_LABELS[value] }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        name="facilitator_id"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1">
            <Combobox
              label="Facilitator"
              placeholder={DSPC_FACILITATOR_TBA_LABEL}
              options={facilitatorOptions}
              value={field.value || DSPC_FACILITATOR_TBA}
              onChange={(value) => field.onChange(value || DSPC_FACILITATOR_TBA)}
              error={errors.facilitator_id?.message}
            />
            <p className="text-xs text-gray-400">Select TBA if the facilitator is still to be arranged.</p>
          </div>
        )}
      />
      <Controller
        name="room_id"
        control={control}
        render={({ field }) => (
          <Combobox
            label="Venue"
            placeholder="Select a venue"
            options={roomOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.room_id?.message}
            className={hasConflict && conflicts.some(c => c.type === 'room') ? 'border-red-500 ring-1 ring-red-400' : ''}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">
          {entry ? 'Date' : 'Date(s)'}
          {!entry && <span className="ml-1 text-xs font-normal text-gray-400">(exact calendar date)</span>}
        </span>
        <div className="flex flex-col gap-2">
          {selectedDates.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="date"
                error={errors.dates?.[index]?.message}
                {...register(`dates.${index}`)}
              />
              {!entry && selectedDates.length > 1 && (
                <button
                  type="button"
                  onClick={() => setValue('dates', selectedDates.filter((_, i) => i !== index), { shouldValidate: true })}
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  aria-label="Remove date"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!entry && (
          <button
            type="button"
            onClick={() => setValue('dates', [...selectedDates, ''], { shouldValidate: false })}
            className="self-start text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Add another date
          </button>
        )}
        {datesError && <p className="text-xs text-red-600">{datesError}</p>}
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
          {entry ? 'Save Changes' : `Add to DSPC Schedule${selectedDates.length > 1 ? ` (${selectedDates.length} dates)` : ''}`}
        </Button>
      </div>
    </form>
  )
}

function ChipPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              value === option.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
