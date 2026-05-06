// Confirmation dialog before deleting a technician.
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useDeleteTechnician } from '@/hooks/useTechnicians'
import type { Technician } from '@/types/api'

interface Props {
  technician: Technician | null
  onClose: () => void
}

export function TechnicianDeleteDialog({ technician, onClose }: Props) {
  const del = useDeleteTechnician()

  const handleConfirm = () => {
    if (!technician) return
    del.mutate(technician.id, { onSuccess: onClose })
  }

  return (
    <AlertDialog open={!!technician} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete technician?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{technician?.Name}</strong>. Remove all
            assignments and availability slots first or the API will return a conflict error.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ErrorAlert error={del.error} />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={del.isPending}>
            {del.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
