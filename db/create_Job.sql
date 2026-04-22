-- Creates the Job table. StartTime is an array of candidate timestamps representing possible start windows.
CREATE TABLE IF NOT EXISTS public."Job" (
    id                  UUID            NOT NULL,
    "Name"              VARCHAR(50)     NULL,
    "DurationInHours"   BIGINT          NOT NULL,
    "StartTime"         TIMESTAMPTZ[]   NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY (id)
);
