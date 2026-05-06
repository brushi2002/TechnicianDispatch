// Confirmation dialog before deleting a job. Surfaces FK conflict errors.
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useDeleteJob } from '@/hooks/useJobs'
import type { Job } from '@/types/api'

interface Props {
  job: Job | null
  onClose: () => void
}

export function JobDeleteDialog({ job, onClose }: Props) {
  const deleteJob = useDeleteJob()

  const handleConfirm = () => {
    if (!job) return
    deleteJob.mutate(job.id, { onSuccess: onClose })
  }

  return (
    <AlertDialog open={!!job} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete job?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{job?.Name ?? 'this job'}</strong>. Remove all
            assignments first — the API will reject the delete if any exist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ErrorAlert error={deleteJob.error} />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteJob.isPending}>
            {deleteJob.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
