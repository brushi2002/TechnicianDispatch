// Job detail: job info card + list of assigned technicians with unassign action.
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/layout/PageHeader'
import { JobEditDialog } from '@/components/jobs/JobEditDialog'
import { AssignTechnicianDialog } from '@/components/jobs/AssignTechnicianDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useJob, useJobAssignments } from '@/hooks/useJobs'
import { useDeleteAssignment } from '@/hooks/useJobAssignments'
import { useTechnicians } from '@/hooks/useTechnicians'
import { formatDateTime } from '@/lib/utils'
import type { Job } from '@/types/api'

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading, error } = useJob(id!)
  const { data: assignments } = useJobAssignments(id!)
  const { data: technicians } = useTechnicians()
  const deleteAssignment = useDeleteAssignment()

  const [editJob, setEditJob]       = useState<Job | null>(null)
  const [showAssign, setShowAssign] = useState(false)

  const techMap = Object.fromEntries((technicians ?? []).map(t => [t.id, t]))

  if (isLoading) return <LoadingSpinner />
  if (error || !job) return <div className="p-6"><ErrorAlert error={error} /></div>

  const endTime = new Date(new Date(job.StartTime).getTime() + job.DurationInHours * 3600_000)

  return (
    <div>
      <PageHeader
        title={job.Name ?? 'Unnamed Job'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/jobs')}>← Back</Button>
            <Button variant="outline" onClick={() => setEditJob(job)}>Edit</Button>
            <Button onClick={() => setShowAssign(true)}>Assign Technician</Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Start</span><p className="font-medium">{formatDateTime(job.StartTime)}</p></div>
            <div><span className="text-muted-foreground">End</span><p className="font-medium">{formatDateTime(endTime.toISOString())}</p></div>
            <div><span className="text-muted-foreground">Duration</span><p className="font-medium">{job.DurationInHours}h</p></div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-base font-semibold mb-3">Assigned Technicians ({assignments?.length ?? 0})</h2>
          {!assignments?.length ? (
            <p className="text-sm text-muted-foreground">No technicians assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.TechnicianId}>
                    <TableCell className="font-medium">
                      {techMap[a.TechnicianId]?.Name ?? a.TechnicianId}
                    </TableCell>
                    <TableCell>{a.JobStartDateTime ? formatDateTime(a.JobStartDateTime) : '—'}</TableCell>
                    <TableCell>{a.JobEndDateTime ? formatDateTime(a.JobEndDateTime) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteAssignment.isPending}
                        onClick={() => deleteAssignment.mutate({ jobId: job.id, technicianId: a.TechnicianId })}
                      >
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <JobEditDialog job={editJob} onClose={() => setEditJob(null)} />
      <AssignTechnicianDialog jobId={showAssign ? job.id : null} onClose={() => setShowAssign(false)} />
    </div>
  )
}
