// Fetch functions and TanStack Query hooks for the Job entity.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Job, JobCreate, JobUpdate, JobAssignment, Technician } from '@/types/api'

// ---- Query key factory -------------------------------------------------

export const jobKeys = {
  lists:                ()           => ['jobs', 'list'] as const,
  detail:               (id: string) => ['jobs', 'detail', id] as const,
  assignments:          (id: string) => ['jobs', 'assignments', id] as const,
  availableTechnicians: (id: string) => ['jobs', 'available-technicians', id] as const,
}

// ---- Fetch functions ----------------------------------------------------

const fetchJobs         = ()                                 => apiClient.get<Job[]>('/jobs/')
const fetchJob          = (id: string)                       => apiClient.get<Job>(`/jobs/${id}`)
const createJob         = (body: JobCreate)                  => apiClient.post<Job>('/jobs/', body)
const updateJob         = (id: string, body: JobUpdate)      => apiClient.patch<Job>(`/jobs/${id}`, body)
const deleteJob         = (id: string)                       => apiClient.delete(`/jobs/${id}`)
const assignTechnician  = (id: string, technician_id: string) =>
  apiClient.post<JobAssignment>(`/jobs/${id}/assign`, { technician_id })
const fetchJobAssignments        = (id: string) => apiClient.get<JobAssignment[]>(`/jobs/${id}/assignments`)
const fetchAvailableTechnicians  = (id: string) => apiClient.get<Technician[]>(`/jobs/${id}/available-technicians`)

// ---- Hooks --------------------------------------------------------------

export function useJobs() {
  return useQuery({ queryKey: jobKeys.lists(), queryFn: fetchJobs })
}

export function useJob(id: string) {
  return useQuery({ queryKey: jobKeys.detail(id), queryFn: () => fetchJob(id) })
}

export function useJobAssignments(jobId: string) {
  return useQuery({
    queryKey: jobKeys.assignments(jobId),
    queryFn:  () => fetchJobAssignments(jobId),
  })
}

export function useAvailableTechnicians(jobId: string | null) {
  return useQuery({
    queryKey: jobKeys.availableTechnicians(jobId ?? ''),
    queryFn:  () => fetchAvailableTechnicians(jobId!),
    enabled:  !!jobId,
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess:  () => qc.invalidateQueries({ queryKey: jobKeys.lists() }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: JobUpdate & { id: string }) => updateJob(id, body),
    onSuccess:  (_data, { id }) => {
      qc.invalidateQueries({ queryKey: jobKeys.lists() })
      qc.invalidateQueries({ queryKey: jobKeys.detail(id) })
    },
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteJob,
    onSuccess:  () => qc.invalidateQueries({ queryKey: jobKeys.lists() }),
  })
}

export function useAssignTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, technicianId }: { jobId: string; technicianId: string }) =>
      assignTechnician(jobId, technicianId),
    onSuccess: (_data, { jobId }) => {
      qc.invalidateQueries({ queryKey: jobKeys.assignments(jobId) })
      qc.invalidateQueries({ queryKey: jobKeys.availableTechnicians(jobId) })
      qc.invalidateQueries({ queryKey: jobKeys.lists() })
    },
  })
}
