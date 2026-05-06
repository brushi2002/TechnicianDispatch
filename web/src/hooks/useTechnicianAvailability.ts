// Fetch functions and TanStack Query hooks for TechnicianAvailability.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { TechnicianAvailability, TechnicianAvailabilityCreate, TechnicianAvailabilityUpdate } from '@/types/api'
import { technicianKeys } from './useTechnicians'

export const availabilityKeys = {
  byTechnician: (technicianId: string) => ['technician-availability', technicianId] as const,
}

const fetchAvailability = (technicianId: string) =>
  apiClient.get<TechnicianAvailability[]>(`/technician-availability/?technician_id=${technicianId}`)

const createAvailability = (body: TechnicianAvailabilityCreate) =>
  apiClient.post<TechnicianAvailability>('/technician-availability/', body)

const updateAvailability = (technicianId: string, dayOfWeek: number, body: TechnicianAvailabilityUpdate) =>
  apiClient.put<TechnicianAvailability>(`/technician-availability/${technicianId}/${dayOfWeek}`, body)

const deleteAvailability = (technicianId: string, dayOfWeek: number) =>
  apiClient.delete(`/technician-availability/${technicianId}/${dayOfWeek}`)

export function useTechnicianAvailability(technicianId: string) {
  return useQuery({
    queryKey: availabilityKeys.byTechnician(technicianId),
    queryFn:  () => fetchAvailability(technicianId),
  })
}

export function useCreateAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAvailability,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: availabilityKeys.byTechnician(vars.TechnicianID) })
      qc.invalidateQueries({ queryKey: technicianKeys.detail(vars.TechnicianID) })
    },
  })
}

export function useUpdateAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ technicianId, dayOfWeek, ...body }: TechnicianAvailabilityUpdate & { technicianId: string; dayOfWeek: number }) =>
      updateAvailability(technicianId, dayOfWeek, body),
    onSuccess: (_data, { technicianId }) => {
      qc.invalidateQueries({ queryKey: availabilityKeys.byTechnician(technicianId) })
    },
  })
}

export function useDeleteAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ technicianId, dayOfWeek }: { technicianId: string; dayOfWeek: number }) =>
      deleteAvailability(technicianId, dayOfWeek),
    onSuccess: (_data, { technicianId }) => {
      qc.invalidateQueries({ queryKey: availabilityKeys.byTechnician(technicianId) })
    },
  })
}
