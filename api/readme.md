# TechnicianDispatch API

FastAPI backend for the Technician Dispatch Management system. Provides REST endpoints for managing technicians, jobs, scheduling, and availability — all backed by a PostgreSQL database via asyncpg.

---

## Setup

```bash
cd api
pip install -r requirements.txt
cp .env.example .env          # edit if your local DB credentials differ
uvicorn main:app --reload --port 8000
```

Interactive docs are available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc) once the server is running.

---

## Architecture

```
api/
├── main.py                         # App entrypoint; registers routers and lifespan
├── database.py                     # asyncpg pool management and connection dependency
├── schemas/                        # Pydantic request/response models
│   ├── technician.py
│   ├── job.py
│   ├── job_assignment.py
│   └── technician_availability.py
└── routers/                        # Route handlers grouped by entity
    ├── technicians.py
    ├── jobs.py
    ├── job_assignments.py
    └── technician_availability.py
```

### Request Flow

```
HTTP Request
    │
    ▼
FastAPI (main.py)
    │  matches path to router
    ▼
Router handler (routers/*.py)
    │  Pydantic validates request body/path params
    │  injects asyncpg Connection via Depends(get_connection)
    ▼
database.py  ──  pool.acquire()  ──►  PostgreSQL
    │                                      │
    │          asyncpg Record              │
    ◄──────────────────────────────────────┘
    │
    ▼
Pydantic response model  ──►  JSON response
```

### Connection Pool

`database.py` holds a single module-level `asyncpg.Pool` that is created once during the FastAPI [lifespan](https://fastapi.tiangolo.com/advanced/events/) startup event and closed on shutdown. Every route handler receives a connection via the `get_connection` dependency, which acquires one from the pool and automatically releases it when the request completes — even if an exception is raised.

```python
# Simplified dependency injection pattern used by every route handler
async def some_endpoint(connection: asyncpg.Connection = Depends(get_connection)):
    records = await connection.fetch('SELECT ...')
    ...
```

### Schema / Validation Layer

Each entity has three Pydantic models in `schemas/`:

| Model | Purpose |
|-------|---------|
| `*Create` | Validates the request body for POST (all required fields, no id) |
| `*Update` | Validates PATCH bodies (all fields optional) |
| `*Response` | Shapes the JSON returned to the client |

Pydantic field aliases match the PascalCase column names used in PostgreSQL (e.g. `"Name"`, `"DurationInHours"`). This lets asyncpg `Record` objects be passed directly as `dict(record)` without any manual field remapping in route handlers.

---

## Data Model

```
Technician ──< TechnicianAvailability
     │            (TechnicianID, DayofWeek)
     │
     └──< JobAssignment >── Job
           (JobId, TechnicianId)
```

| Table | Primary Key | Notable Columns |
|-------|-------------|-----------------|
| `Technician` | `id` UUID | `Name`, `Address` |
| `Job` | `id` UUID | `Name`, `DurationInHours`, `StartTime` (TIMESTAMPTZ) |
| `JobAssignment` | `(JobId, TechnicianId)` composite | `JobStartTime`, `JobEndDate` |
| `TechnicianAvailability` | `(TechnicianID, DayofWeek)` composite | `StartTime`, `EndTime` (TIMETZ) |

`TechnicianAvailability.DayofWeek` is an integer: `0` = Sunday, `6` = Saturday.

---

## Endpoints

All routes are prefixed with `/api/v1`.

### Technicians

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/technicians` | List all technicians |
| `POST` | `/technicians` | Create a technician |
| `GET` | `/technicians/{id}` | Get a technician by id |
| `PATCH` | `/technicians/{id}` | Partially update a technician |
| `DELETE` | `/technicians/{id}` | Delete a technician |
| `GET` | `/technicians/{id}/availability` | List all availability slots for a technician |
| `GET` | `/technicians/{id}/assignments` | List all job assignments for a technician |

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create a job |
| `GET` | `/jobs/{id}` | Get a job by id |
| `PATCH` | `/jobs/{id}` | Partially update a job |
| `DELETE` | `/jobs/{id}` | Delete a job |
| `POST` | `/jobs/{id}/assign` | Assign a technician to a job |
| `GET` | `/jobs/{id}/assignments` | List all technician assignments for a job |

### Job Assignments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/job-assignments` | List all assignments (filter via `?job_id=` or `?technician_id=`) |
| `GET` | `/job-assignments/{job_id}/{technician_id}` | Get an assignment by composite key |
| `PUT` | `/job-assignments/{job_id}/{technician_id}` | Update assignment timestamps |
| `DELETE` | `/job-assignments/{job_id}/{technician_id}` | Remove an assignment |

### Technician Availability

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/technician-availability` | List all slots (filter via `?technician_id=` or `?day_of_week=`) |
| `POST` | `/technician-availability` | Create an availability slot |
| `GET` | `/technician-availability/{technician_id}/{day_of_week}` | Get a slot by composite key |
| `PUT` | `/technician-availability/{technician_id}/{day_of_week}` | Update a slot's time window |
| `DELETE` | `/technician-availability/{technician_id}/{day_of_week}` | Remove a slot |

---

## Assigning a Technician to a Job

`POST /api/v1/jobs/{job_id}/assign` is the only endpoint for creating assignments. It runs a series of validations before inserting:

1. Job exists
2. Technician exists
3. Technician has an availability record for the job's day of week
4. Technician's availability hours fully cover the job's time window
5. Technician has no overlapping assignment with another job

**Request body:**
```json
{
  "technician_id": "uuid",
  "job_start_time": "2026-05-01T08:00:00-05:00",  // optional
  "job_end_date":   "2026-05-01T12:00:00-05:00"   // optional
}
```

**Responses:**
- `201 Created` — assignment created successfully
- `404 Not Found` — job or technician does not exist
- `409 Conflict` — technician is unavailable on that day, outside their availability hours, already booked during that window, or already assigned to this job

---

## Error Handling

| Status | Cause |
|--------|-------|
| `400 Bad Request` | PATCH body contains no updatable fields |
| `404 Not Found` | Resource identified by path param does not exist |
| `409 Conflict` | Duplicate assignment/availability, or FK constraint blocks a delete |

Cascade deletes are not defined in the database schema. To delete a `Technician` or `Job`, remove their related `JobAssignment` and `TechnicianAvailability` records first, or the API will return `409 Conflict`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full asyncpg-compatible PostgreSQL connection string |

Example: `postgresql://user:password@localhost:5432/TechnicianDispatch`
