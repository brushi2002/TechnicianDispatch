// Route tree. All pages are wrapped in AppShell which provides the sidebar.
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { JobsPage } from '@/pages/JobsPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { TechniciansPage } from '@/pages/TechniciansPage'
import { TechnicianDetailPage } from '@/pages/TechnicianDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/"                element={<DashboardPage />} />
        <Route path="/jobs"            element={<JobsPage />} />
        <Route path="/jobs/:id"        element={<JobDetailPage />} />
        <Route path="/technicians"     element={<TechniciansPage />} />
        <Route path="/technicians/:id" element={<TechnicianDetailPage />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
