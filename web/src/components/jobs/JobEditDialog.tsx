// Modal form for editing an existing job's name, duration, and start time.
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useUpdateJob } from '@/hooks/useJobs'
import type { Job } from '@/types/api'

interface Props {
  job: Job | null
  onClose: () => void
}

function toLocalDatetimeValue(iso: string): string {
  // Convert ISO string to "YYYY-MM-DDTHH:mm" for datetime-local input
  return new Date(iso).toISOString().slice(0, 16)
}

export function JobEditDialog({ job, onClose }: Props) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [startTime, setStartTime] = useState('')
  const updateJob = useUpdateJob()

  useEffect(() => {
    if (job) {
      setName(job.Name ?? '')
      setDuration(String(job.DurationInHours))
      setStartTime(toLocalDatetimeValue(job.StartTime))
    }
  }, [job])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return
    updateJob.mutate(
      { id: job.id, name: name || undefined, duration_in_hours: Number(duration), start_time: new Date(startTime).toISOString() },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={!!job} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert error={updateJob.error} />
          <div className="space-y-1">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-duration">Duration (hours) *</Label>
            <Input id="edit-duration" type="number" min="1" required value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-start">Start Time *</Label>
            <Input id="edit-start" type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateJob.isPending}>
              {updateJob.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
