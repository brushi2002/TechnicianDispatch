// Technician picker dialog for POST /jobs/{id}/assign.
// Only shows technicians whose availability covers the job's day and time window
// and who have no conflicting assignment. Surfaces 409 detail messages verbatim.
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useAssignTechnician, useAvailableTechnicians } from '@/hooks/useJobs'
import { useAssignments } from '@/hooks/useJobAssignments'

interface Props {
  jobId: string | null
  onClose: () => void
}

export function AssignTechnicianDialog({ jobId, onClose }: Props) {
  const [technicianId, setTechnicianId] = useState('')
  const { data: existing, isLoading: loadingExisting } = useAssignments(jobId ?? undefined)
  const { data: technicians, isLoading: loadingTechnicians } = useAvailableTechnicians(jobId)
  const assign = useAssignTechnician()

  const isLoading  = loadingExisting || loadingTechnicians
  const isAssigned = !loadingExisting && !!existing?.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId || !technicianId) return
    assign.mutate(
      { jobId, technicianId },
      {
        onSuccess: () => {
          onClose()
          setTechnicianId('')
        },
      },
    )
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTechnicianId('')
      onClose()
    }
  }

  return (
    <Dialog open={!!jobId} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert error={assign.error} />

          {isAssigned ? (
            <p className="text-sm text-amber-600">
              This job already has a technician assigned. Unassign them from the job detail page before reassigning.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Only technicians who are available for this job's time are shown.
              </p>
              <div className="space-y-1">
                <Label>Technician *</Label>
                {!isLoading && technicians?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No technicians are available for this job's day and time window.
                  </p>
                ) : (
                  <Select value={technicianId} onValueChange={setTechnicianId} required>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a technician'} />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.Name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {!isAssigned && (
              <Button type="submit" disabled={!technicianId || assign.isPending || technicians?.length === 0}>
                {assign.isPending ? 'Assigning…' : 'Assign'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
