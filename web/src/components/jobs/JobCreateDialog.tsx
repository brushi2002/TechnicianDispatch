// Modal form for creating a new job.
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useCreateJob } from '@/hooks/useJobs'

interface Props {
  open: boolean
  onClose: () => void
}

export function JobCreateDialog({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [startTime, setStartTime] = useState('')
  const createJob = useCreateJob()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createJob.mutate(
      { name: name || undefined, duration_in_hours: Number(duration), start_time: new Date(startTime).toISOString() },
      {
        onSuccess: () => {
          onClose()
          setName('')
          setDuration('')
          setStartTime('')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert error={createJob.error} />
          <div className="space-y-1">
            <Label htmlFor="job-name">Name</Label>
            <Input id="job-name" value={name} onChange={e => setName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="job-duration">Duration (hours) *</Label>
            <Input id="job-duration" type="number" min="1" required value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="job-start">Start Time *</Label>
            <Input id="job-start" type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
