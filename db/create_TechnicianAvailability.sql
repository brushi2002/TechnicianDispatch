-- Creates the TechnicianAvailability table. Stores weekly availability windows per technician.
-- DayofWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
-- Depends on: Technician
CREATE TABLE IF NOT EXISTS public."TechnicianAvailability" (
    "TechnicianID"  UUID        NOT NULL,
    "DayofWeek"     INTEGER     NOT NULL,
    "StartTime"     TIMETZ      NULL,
    "EndTime"       TIMETZ      NULL,

    CONSTRAINT "TechnicianAvailability_pkey" PRIMARY KEY ("TechnicianID", "DayofWeek"),
    CONSTRAINT "fk_techid" FOREIGN KEY ("TechnicianID") REFERENCES public."Technician"(id)
);
