// Fetch functions and TanStack Query hooks for JobAssignment read/delete operations.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { JobAssignment } from '@/types/api'
import { jobKeys } from './useJobs'
import { technicianKeys } from './useTechnicians'

export const assignmentKeys = {
  lists: (jobId?: string, technicianId?: string) =>
    ['job-assignments', { jobId, technicianId }] as const,
}

const fetchAssignments = (jobId?: string, technicianId?: string) => {
  const params = new URLSearchParams()
  if (jobId) params.set('job_id', jobId)
  if (technicianId) params.set('technician_id', technicianId)
  const qs = params.toString()
  return apiClient.get<JobAssignment[]>(`/job-assignments/${qs ? `?${qs}` : ''}`)
}

const deleteAssignment = ({ jobId, technicianId }: { jobId: string; technicianId: string }) =>
  apiClient.delete(`/job-assignments/${jobId}/${technicianId}`)

export function useAssignments(jobId?: string, technicianId?: string, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.lists(jobId, technicianId),
    queryFn:  () => fetchAssignments(jobId, technicianId),
    enabled,
  })
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: (_data, { jobId, technicianId }) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.lists(jobId) })
      qc.invalidateQueries({ queryKey: jobKeys.assignments(jobId) })
      qc.invalidateQueries({ queryKey: jobKeys.availableTechnicians(jobId) })
      qc.invalidateQueries({ queryKey: technicianKeys.assignments(technicianId) })
      qc.invalidateQueries({ queryKey: jobKeys.lists() })
    },
  })
}
