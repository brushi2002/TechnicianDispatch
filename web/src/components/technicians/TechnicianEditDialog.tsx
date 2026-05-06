// Modal form for editing a technician's name and address.
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useUpdateTechnician } from '@/hooks/useTechnicians'
import type { Technician } from '@/types/api'

interface Props {
  technician: Technician | null
  onClose: () => void
}

export function TechnicianEditDialog({ technician, onClose }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const update = useUpdateTechnician()

  useEffect(() => {
    if (technician) {
      setName(technician.Name)
      setAddress(technician.Address ?? '')
    }
  }, [technician])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!technician) return
    update.mutate(
      { id: technician.id, name, address: address || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={!!technician} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Technician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert error={update.error} />
          <div className="space-y-1">
            <Label htmlFor="edit-tech-name">Name *</Label>
            <Input id="edit-tech-name" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-tech-address">Address</Label>
            <Input id="edit-tech-address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
