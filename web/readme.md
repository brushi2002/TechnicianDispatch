# TechnicianDispatch — Web

React + TypeScript frontend for the TechnicianDispatch management system. Communicates with the FastAPI backend via a Vite dev proxy.

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Routing | React Router v7 |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Build tool | Vite |

## Prerequisites

- Node.js 18+
- The FastAPI backend running on `http://localhost:8000`

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. All `/api/*` requests are proxied to the backend automatically — no CORS configuration needed in development.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── pages/                  # One file per route
│   ├── DashboardPage.tsx   # Summary stats
│   ├── JobsPage.tsx        # Jobs list with filtering and sorting
│   ├── JobDetailPage.tsx   # Job info, assigned technician, unassign action
│   ├── TechniciansPage.tsx # Technicians list
│   └── TechnicianDetailPage.tsx  # Technician info, availability grid, assignment history
│
├── components/
│   ├── jobs/               # Job-specific dialogs and table (create, edit, delete, assign)
│   ├── technicians/        # Technician-specific dialogs, table, and availability grid
│   ├── layout/             # AppShell, Sidebar, PageHeader
│   ├── shared/             # ErrorAlert, LoadingSpinner, EmptyState
│   └── ui/                 # shadcn/ui primitives (button, dialog, table, etc.)
│
├── hooks/                  # TanStack Query hooks — one file per resource
│   ├── useJobs.ts
│   ├── useTechnicians.ts
│   ├── useJobAssignments.ts
│   └── useTechnicianAvailability.ts
│
├── lib/
│   ├── api-client.ts       # Fetch wrapper with error handling (ApiError)
│   └── utils.ts            # cn(), formatDateTime(), formatTime()
│
└── types/
    └── api.ts              # TypeScript interfaces matching FastAPI response shapes
```

## Data Flow

```
Page component
  → custom hook (useJobs, useTechnicians, …)
    → TanStack Query (caching, refetching, mutation)
      → apiClient.get / .post / .patch / .delete
        → /api/v1/* (Vite proxy)
          → FastAPI backend
```

Mutations automatically invalidate the relevant query keys so the UI stays in sync without manual refreshes.

## API Client

`src/lib/api-client.ts` wraps `fetch` with:

- Base URL of `/api/v1`
- JSON request/response handling
- `ApiError` class that surfaces the FastAPI `detail` field for display in `ErrorAlert`

## Key Conventions

- **PascalCase API fields** — FastAPI responses use `by_alias=True`, so interfaces in `api.ts` match the PascalCase column names (`Name`, `StartTime`, `JobId`, etc.)
- **Trailing slashes on list endpoints** — required to avoid a 307 redirect that bypasses the Vite proxy
- **`formatDateTime`** for full timestamp fields (`Job.StartTime`, `JobAssignment.JobStartDateTime`); the browser converts to local time automatically
- **`formatTime`** for bare `TIMETZ` fields (`TechnicianAvailability.StartTime`) — slices `HH:MM` from the `HH:MM:SS±HH` string
