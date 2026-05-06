// Jobs list page with filtering, sorting, and CRUD actions.
import { PageHeader } from '@/components/layout/PageHeader'
import { JobsTable } from '@/components/jobs/JobsTable'

export function JobsPage() {
  return (
    <div>
      <PageHeader title="Jobs" />
      <JobsTable />
    </div>
  )
}
