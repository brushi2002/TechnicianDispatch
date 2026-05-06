// Technician detail: info card, availability grid, and assignment history.
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/layout/PageHeader'
import { TechnicianEditDialog } from '@/components/technicians/TechnicianEditDialog'
import { AvailabilityGrid } from '@/components/technicians/AvailabilityGrid'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useTechnician, useTechnicianAssignments } from '@/hooks/useTechnicians'
import { useJobs } from '@/hooks/useJobs'
import { formatDateTime } from '@/lib/utils'
import type { Technician } from '@/types/api'

export function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: technician, isLoading, error } = useTechnician(id!)
  const { data: assignments } = useTechnicianAssignments(id!)
  const { data: jobs } = useJobs()

  const [editTech, setEditTech] = useState<Technician | null>(null)

  const jobMap = Object.fromEntries((jobs ?? []).map(j => [j.id, j]))

  if (isLoading) return <LoadingSpinner />
  if (error || !technician) return <div className="p-6"><ErrorAlert error={error} /></div>

  return (
    <div>
      <PageHeader
        title={technician.Name}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/technicians')}>← Back</Button>
            <Button variant="outline" onClick={() => setEditTech(technician)}>Edit</Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <span className="text-muted-foreground">Address</span>
            <p className="font-medium">{technician.Address ?? '—'}</p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-base font-semibold mb-3">Weekly Availability</h2>
          <AvailabilityGrid technicianId={technician.id} />
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Assignments ({assignments?.length ?? 0})</h2>
          {!assignments?.length ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.JobId}>
                    <TableCell>
                      <Link
                        to={`/jobs/${a.JobId}`}
                        className="font-medium underline-offset-2 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {jobMap[a.JobId]?.Name ?? a.JobId}
                      </Link>
                    </TableCell>
                    <TableCell>{a.JobStartDateTime ? formatDateTime(a.JobStartDateTime) : '—'}</TableCell>
                    <TableCell>{a.JobEndDateTime ? formatDateTime(a.JobEndDateTime) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <TechnicianEditDialog technician={editTech} onClose={() => setEditTech(null)} />
    </div>
  )
}
