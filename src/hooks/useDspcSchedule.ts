import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '../lib/http'
import type { ContestCategory, DspcScheduleEntry, LanguageOption, LevelOption } from '../types'

// API route: /api/dspc-schedule
const KEY = 'dspc-schedule'

type DbEntry = {
  id: string
  contest: ContestCategory
  language: LanguageOption
  level: LevelOption
  facilitatorId: string | null
  roomId: string
  eventDate: string
  startTime: string
  endTime: string
  createdAt: string
  facilitator: { id: string; fullName: string; createdAt: string } | null
  room: { id: string; name: string; createdAt: string } | null
}

function mapRow(row: DbEntry): DspcScheduleEntry {
  return {
    id: row.id,
    contest: row.contest,
    language: row.language,
    level: row.level,
    facilitator_id: row.facilitatorId,
    room_id: row.roomId,
    event_date: row.eventDate.slice(0, 10),
    start_time: row.startTime,
    end_time: row.endTime,
    created_at: row.createdAt,
    facilitator: row.facilitator
      ? { id: row.facilitator.id, name: row.facilitator.fullName, created_at: row.facilitator.createdAt }
      : undefined,
    room: row.room ? { id: row.room.id, name: row.room.name, created_at: row.room.createdAt } : undefined,
  }
}

export function useDspcSchedule() {
  return useQuery<DspcScheduleEntry[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const rows = await fetchJson<DbEntry[]>('/api/dspc-schedule')
      return rows.map(mapRow)
    },
    retry: false,
  })
}

export interface CreateDspcSchedulePayload {
  contest: ContestCategory
  language: LanguageOption
  level: LevelOption
  facilitator_id: string | null
  room_id: string
  event_date: string
  start_time: string
  end_time: string
}

function toApiBody(payload: CreateDspcSchedulePayload) {
  return {
    contest: payload.contest,
    language: payload.language,
    level: payload.level,
    facilitatorId: payload.facilitator_id,
    roomId: payload.room_id,
    eventDate: payload.event_date,
    startTime: payload.start_time,
    endTime: payload.end_time,
  }
}

export function useCreateDspcScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateDspcSchedulePayload) => {
      const row = await fetchJson<DbEntry>('/api/dspc-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiBody(payload)),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateDspcScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: CreateDspcSchedulePayload & { id: string }) => {
      const row = await fetchJson<DbEntry>(`/api/dspc-schedule/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiBody(payload)),
      })
      return mapRow(row)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteDspcScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchJson(`/api/dspc-schedule/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
