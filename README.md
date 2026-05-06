# TechnicianDispatch

A technician dispatch management system for scheduling field technicians against jobs. Built with a React frontend, FastAPI backend, and PostgreSQL database.

## Services

| Service | Tech | Port |
|---|---|---|
| Web | React 19 + Vite + TypeScript | 5173 |
| API | FastAPI + asyncpg (Python 3.12) | 8000 |
| Database | PostgreSQL 16 | 5432 |

## Quick Start (Docker)

```bash
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`

The database is created, migrated, and seeded automatically on first boot. To wipe and reseed:

```bash
docker-compose down -v && docker-compose up --build
```

## Manual Setup (without Docker)

### Database

Create a PostgreSQL database and run the schema scripts in order:

```bash
psql -U <user> -d TechnicianDispatch -f db/create_Technician.sql
psql -U <user> -d TechnicianDispatch -f db/create_Job.sql
psql -U <user> -d TechnicianDispatch -f db/create_TechnicianAvailability.sql
psql -U <user> -d TechnicianDispatch -f db/create_JobAssignment.sql
psql -U <user> -d TechnicianDispatch -f db/test_data.sql  # optional seed data
```

### API

```bash
cd api
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL
uvicorn main:app --reload --port 8000
```

### Web

```bash
cd web
npm install
npm run dev
```

## Project Structure

```
TechnicianDispatch/
├── docker-compose.yml      # Dev environment (all three services)
├── api/                    # FastAPI backend
│   ├── Dockerfile
│   ├── main.py             # App entrypoint, router registration
│   ├── database.py         # asyncpg connection pool
│   ├── routers/            # Route handlers (technicians, jobs, assignments, availability)
│   ├── schemas/            # Pydantic request/response models
│   └── requirements.txt
├── web/                    # React frontend
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/          # One component per route
│   │   ├── components/     # Feature components and shared UI
│   │   ├── hooks/          # TanStack Query data hooks
│   │   ├── lib/            # API client and utilities
│   │   └── types/          # TypeScript interfaces for API contracts
│   └── package.json
└── db/                     # SQL schema and seed data
    ├── create_Technician.sql
    ├── create_Job.sql
    ├── create_TechnicianAvailability.sql
    ├── create_JobAssignment.sql
    └── test_data.sql
```

## Features

- **Jobs** — Create, edit, and delete jobs with a scheduled start time and duration
- **Technicians** — Manage technicians and their weekly availability windows
- **Assignment** — Assign a technician to a job; the API validates that the technician is available on that day, their hours cover the job window, and they have no conflicting assignment
- **Dashboard** — Summary counts for total jobs, unassigned jobs, technicians, and active assignments

## Further Reading

- [`api/readme.md`](api/readme.md) — API architecture, endpoints, and error handling
- [`db/readme.md`](db/readme.md) — Database schema and table relationships
- [`web/README.md`](web/README.md) — Frontend architecture and conventions
