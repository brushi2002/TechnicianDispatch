-- Creates the JobAssignment table. Junction table linking a Job to a Technician with a composite primary key.
-- Depends on: Technician, Job
CREATE TABLE IF NOT EXISTS public."JobAssignment" (
    "JobId"         UUID            NOT NULL,
    "TechnicianId"  UUID            NOT NULL,
    "JobStartTime"  TIMESTAMPTZ     NULL,
    "JobEndDate"    TIMESTAMPTZ     NULL,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("JobId", "TechnicianId"),
    CONSTRAINT "Job_FK"        FOREIGN KEY ("JobId")        REFERENCES public."Job"(id),
    CONSTRAINT "Technician_FK" FOREIGN KEY ("TechnicianId") REFERENCES public."Technician"(id)
);
