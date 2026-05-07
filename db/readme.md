# TechnicianDispatch Data Model

## Overview

The `TechnicianDispatch` database supports a technician dispatch system. It tracks technicians, the jobs they can be assigned to, their weekly availability, and the resolved assignments linking a technician to a specific job start time.

---

## Tables

### Technician

Represents a field technician.

| Column  | Type         | Nullable | Notes            |
|---------|--------------|----------|------------------|
| id      | UUID         | NO       | Primary key      |
| Name    | VARCHAR(50)  | NO       |                  |
| Address | VARCHAR(200) | YES      | Physical address |

---

### Job

Represents a job to be dispatched. A job has a scheduled start time and a duration.

| Column          | Type        | Nullable | Notes                               |
|-----------------|-------------|----------|-------------------------------------|
| id              | UUID        | NO       | Primary key                         |
| Name            | VARCHAR(50) | YES      |                                     |
| DurationInHours | BIGINT      | NO       | Expected length of the job in hours |
| StartTime       | TIMESTAMPTZ | NO       | Scheduled start timestamp           |

---

### JobAssignment

Junction table that records the assignment of a technician to a job. The composite primary key enforces that a given (job, technician) pair can only be assigned once. The resolved start and end times are stored here.

| Column        | Type        | Nullable | Notes                                  |
|---------------|-------------|----------|----------------------------------------|
| JobId         | UUID        | NO       | PK + FK → Job.id                       |
| TechnicianId  | UUID        | NO       | PK + FK → Technician.id               |
| JobStartDateTime | TIMESTAMPTZ | YES      | Resolved start datetime for this assignment |
| JobEndDateTime   | TIMESTAMPTZ | YES      | Resolved end datetime for this assignment   |

**Constraints:**
- `JobAssignment_pkey` — composite primary key on (`JobId`, `TechnicianId`)
- `Job_FK` — foreign key to `Job(id)`
- `Technician_FK` — foreign key to `Technician(id)`

---

### TechnicianAvailability

Stores a technician's recurring weekly availability. Each row represents a single day-of-week availability window. The composite primary key ensures at most one window per technician per day.

| Column       | Type    | Nullable | Notes                              |
|--------------|---------|----------|------------------------------------|
| TechnicianID | UUID    | NO       | PK + FK → Technician.id            |
| DayofWeek    | INTEGER | NO       | PK — 1 = Monday … 5 = Friday (weekdays only) |
| StartTime    | TIMETZ  | YES      | Start of availability window       |
| EndTime      | TIMETZ  | YES      | End of availability window         |

**Constraints:**
- `TechnicianAvailability_pkey` — composite primary key on (`TechnicianID`, `DayofWeek`)
- `chk_weekday` — `DayofWeek` must be between 1 and 5
- `chk_end_after_start` — `EndTime` must be greater than `StartTime` (passes when either is NULL)
- `fk_techid` — foreign key to `Technician(id)`

---

## Relationships

```
Technician ──< TechnicianAvailability   (one technician, many availability windows)
Technician ──< JobAssignment            (one technician, many assignments)
Job        ──< JobAssignment            (one job, many assignments)
```

---

## CREATE Script Execution Order

Run scripts in dependency order:

1. `create_Technician.sql`
2. `create_Job.sql`
3. `create_JobAssignment.sql`
4. `create_TechnicianAvailability.sql`
