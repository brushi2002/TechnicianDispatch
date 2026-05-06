// Filterable, sortable jobs table with edit, delete, and assign actions.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobFilters, type SortKey, type SortDir } from './JobFilters'
import { JobCreateDialog } from './JobCreateDialog'
import { JobEditDialog } from './JobEditDialog'
import { JobDeleteDialog } from './JobDeleteDialog'
import { AssignTechnicianDialog } from './AssignTechnicianDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { useJobs } from '@/hooks/useJobs'
import { useAssignments } from '@/hooks/useJobAssignments'
import { formatDateTime } from '@/lib/utils'
import type { Job } from '@/types/api'

function AssignmentCount({ jobId }: { jobId: string }) {
  const { data } = useAssignments(jobId)
  return <Badge variant="secondary">{data?.length ?? '—'}</Badge>
}

export function JobsTable() {
  const navigate = useNavigate()
  const { data: jobs, isLoading, error } = useJobs()

  const [search, setSearch]       = useState('')
  const [sortKey, setSortKey]     = useState<SortKey>('StartTime')
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [showCreate, setShowCreate] = useState(false)
  const [editJob, setEditJob]     = useState<Job | null>(null)
  const [deleteJob, setDeleteJob] = useState<Job | null>(null)
  const [assignJobId, setAssignJobId] = useState<string | null>(null)

  const displayJobs = useMemo(() => {
    return (jobs ?? [])
      .filter(j => !search || (j.Name ?? '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [jobs, search, sortKey, sortDir])

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="p-6"><ErrorAlert error={error} /></div>

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <JobFilters
          search={search}
          onSearchChange={setSearch}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(k, d) => { setSortKey(k); setSortDir(d) }}
        />
        <Button onClick={() => setShowCreate(true)} className="ml-4">New Job</Button>
      </div>

      {displayJobs.length === 0 ? (
        <EmptyState message="No jobs found." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayJobs.map(job => (
              <TableRow
                key={job.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <TableCell className="font-medium">{job.Name ?? <span className="text-muted-foreground italic">Unnamed</span>}</TableCell>
                <TableCell>{formatDateTime(job.StartTime)}</TableCell>
                <TableCell>{job.DurationInHours}h</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <AssignmentCount jobId={job.id} />
                </TableCell>
                <TableCell className="text-right space-x-2" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => setAssignJobId(job.id)}>Assign</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditJob(job)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteJob(job)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <JobCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <JobEditDialog job={editJob} onClose={() => setEditJob(null)} />
      <JobDeleteDialog job={deleteJob} onClose={() => setDeleteJob(null)} />
      <AssignTechnicianDialog jobId={assignJobId} onClose={() => setAssignJobId(null)} />
    </>
  )
}
