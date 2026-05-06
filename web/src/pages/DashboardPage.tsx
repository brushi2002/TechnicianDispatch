// Dashboard showing summary counts for jobs and assignments.
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { useJobs } from '@/hooks/useJobs'
import { useAssignments } from '@/hooks/useJobAssignments'
import { useTechnicians } from '@/hooks/useTechnicians'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: jobs }         = useJobs()
  const { data: technicians }  = useTechnicians()
  const { data: assignments }  = useAssignments()

  const assignedJobIds = useMemo(
    () => new Set((assignments ?? []).map(a => a.JobId)),
    [assignments],
  )

  const stats = [
    { label: 'Total Jobs',      value: jobs?.length ?? '—',                       to: '/jobs'        },
    { label: 'Unassigned Jobs', value: (jobs ?? []).filter(j => !assignedJobIds.has(j.id)).length, to: '/jobs' },
    { label: 'Technicians',     value: technicians?.length ?? '—',                to: '/technicians' },
    { label: 'Assignments',     value: assignments?.length ?? '—',                to: '/jobs'        },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        {stats.map(({ label, value, to }) => (
          <Card
            key={label}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate(to)}
          >
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
