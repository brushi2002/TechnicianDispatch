// Navigation sidebar with links to Jobs and Technicians pages.
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const links = [
  { to: '/',             label: 'Dashboard' },
  { to: '/jobs',         label: 'Jobs'        },
  { to: '/technicians',  label: 'Technicians' },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar h-screen flex flex-col">
      <div className="px-6 py-5 border-b">
        <span className="font-semibold text-sm tracking-wide">TechDispatch</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
