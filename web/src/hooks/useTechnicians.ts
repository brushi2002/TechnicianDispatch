// Fetch functions and TanStack Query hooks for the Technician entity.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Technician, TechnicianCreate, TechnicianUpdate, JobAssignment } from '@/types/api'

export const technicianKeys = {
  lists:       ()           => ['technicians', 'list'] as const,
  detail:      (id: string) => ['technicians', 'detail', id] as const,
  assignments: (id: string) => ['technicians', 'assignments', id] as const,
}

const fetchTechnicians          = ()                              => apiClient.get<Technician[]>('/technicians/')
const fetchTechnician           = (id: string)                    => apiClient.get<Technician>(`/technicians/${id}`)
const createTechnician          = (body: TechnicianCreate)        => apiClient.post<Technician>('/technicians/', body)
const updateTechnician          = (id: string, body: TechnicianUpdate) => apiClient.patch<Technician>(`/technicians/${id}`, body)
const deleteTechnician          = (id: string)                    => apiClient.delete(`/technicians/${id}`)
const fetchTechnicianAssignments = (id: string)                   => apiClient.get<JobAssignment[]>(`/technicians/${id}/assignments`)

export function useTechnicians() {
  return useQuery({ queryKey: technicianKeys.lists(), queryFn: fetchTechnicians })
}

export function useTechnician(id: string) {
  return useQuery({ queryKey: technicianKeys.detail(id), queryFn: () => fetchTechnician(id) })
}

export function useTechnicianAssignments(technicianId: string) {
  return useQuery({
    queryKey: technicianKeys.assignments(technicianId),
    queryFn:  () => fetchTechnicianAssignments(technicianId),
  })
}

export function useCreateTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTechnician,
    onSuccess:  () => qc.invalidateQueries({ queryKey: technicianKeys.lists() }),
  })
}

export function useUpdateTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: TechnicianUpdate & { id: string }) => updateTechnician(id, body),
    onSuccess:  (_data, { id }) => {
      qc.invalidateQueries({ queryKey: technicianKeys.lists() })
      qc.invalidateQueries({ queryKey: technicianKeys.detail(id) })
    },
  })
}

export function useDeleteTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTechnician,
    onSuccess:  () => qc.invalidateQueries({ queryKey: technicianKeys.lists() }),
  })
}
