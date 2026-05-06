// Modal form for creating a new technician.
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useCreateTechnician } from '@/hooks/useTechnicians'

interface Props {
  open: boolean
  onClose: () => void
}

export function TechnicianCreateDialog({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const create = useCreateTechnician()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate(
      { name, address: address || undefined },
      {
        onSuccess: () => {
          onClose()
          setName('')
          setAddress('')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Technician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert error={create.error} />
          <div className="space-y-1">
            <Label htmlFor="tech-name">Name *</Label>
            <Input id="tech-name" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tech-address">Address</Label>
            <Input id="tech-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
