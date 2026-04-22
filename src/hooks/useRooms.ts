import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Room } from '../types'

const KEY = 'rooms'

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from('rooms').select('*').order('name')
      if (error) throw error
      return data
    },
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('rooms').insert({ name }).select().single()
      if (error) throw error
      return data as Room
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase.from('rooms').update({ name }).eq('id', id).select().single()
      if (error) throw error
      return data as Room
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}
