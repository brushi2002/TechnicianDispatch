// Sortable technicians table with edit, delete, and detail navigation.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { TechnicianCreateDialog } from './TechnicianCreateDialog'
import { TechnicianEditDialog } from './TechnicianEditDialog'
import { TechnicianDeleteDialog } from './TechnicianDeleteDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useTechnicians } from '@/hooks/useTechnicians'
import type { Technician } from '@/types/api'

export function TechniciansTable() {
  const navigate = useNavigate()
  const { data: technicians, isLoading, error } = useTechnicians()
  const [showCreate, setShowCreate] = useState(false)
  const [editTech, setEditTech]   = useState<Technician | null>(null)
  const [deleteTech, setDeleteTech] = useState<Technician | null>(null)

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="p-6"><ErrorAlert error={error} /></div>

  return (
    <>
      <div className="flex justify-end px-6 py-3 border-b">
        <Button onClick={() => setShowCreate(true)}>New Technician</Button>
      </div>

      {!technicians?.length ? (
        <EmptyState message="No technicians found." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map(tech => (
              <TableRow
                key={tech.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/technicians/${tech.id}`)}
              >
                <TableCell className="font-medium">{tech.Name}</TableCell>
                <TableCell className="text-muted-foreground">{tech.Address ?? '—'}</TableCell>
                <TableCell className="text-right space-x-2" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => setEditTech(tech)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteTech(tech)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TechnicianCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <TechnicianEditDialog technician={editTech} onClose={() => setEditTech(null)} />
      <TechnicianDeleteDialog technician={deleteTech} onClose={() => setDeleteTech(null)} />
    </>
  )
}
