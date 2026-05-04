-- Creates the Job table. StartTime is a single scheduled start timestamp.
CREATE TABLE IF NOT EXISTS public."Job" (
    id                  UUID            NOT NULL,
    "Name"              VARCHAR(50)     NULL,
    "DurationInHours"   BIGINT          NOT NULL,
    "StartTime" timestamp with time zone NOT NULL,       

    CONSTRAINT "Job_pkey" PRIMARY KEY (id)
);
