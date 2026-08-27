import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ContestCategory, DspcScheduleEntry, LanguageOption, LevelOption } from '../types'

const TABLE = 'dspc_schedule'
const KEY = 'dspc-schedule'

const SELECT = `
  *,
  facilitator:instructors!facilitator_id(id, full_name, created_at),
  room:rooms(id, name, created_at)
`

type DbEntry = Omit<DspcScheduleEntry, 'facilitator'> & {
  facilitator: { id: string; full_name: string; created_at: string } | null
}

function mapRow(row: DbEntry): DspcScheduleEntry {
  return {
    ...row,
    event_date: String(row.event_date).slice(0, 10),
    facilitator: row.facilitator
      ? { id: row.facilitator.id, name: row.facilitator.full_name, created_at: row.facilitator.created_at }
      : undefined,
  }
}

export function useDspcSchedule() {
  return useQuery<DspcScheduleEntry[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLE).select(SELECT).order('event_date').order('start_time')
      if (error) throw error
      return (data as DbEntry[]).map(mapRow)
    },
    retry: false,
  })
}

export interface CreateDspcSchedulePayload {
  contest: ContestCategory
  language: LanguageOption
  level: LevelOption
  facilitator_id: string
  room_id: string
  event_date: string
  start_time: string
  end_time: string
}

export function useCreateDspcScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateDspcSchedulePayload) => {
      const { data, error } = await supabase.from(TABLE).insert(payload).select(SELECT).single()
      if (error) throw error
      return mapRow(data as DbEntry)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateDspcScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: CreateDspcSchedulePayload & { id: string }) => {
      const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select(SELECT).single()
      if (error) throw error
      return mapRow(data as DbEntry)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteDspcScheduleEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
