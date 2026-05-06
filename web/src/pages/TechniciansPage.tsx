// Technicians list page.
import { PageHeader } from '@/components/layout/PageHeader'
import { TechniciansTable } from '@/components/technicians/TechniciansTable'

export function TechniciansPage() {
  return (
    <div>
      <PageHeader title="Technicians" />
      <TechniciansTable />
    </div>
  )
}
