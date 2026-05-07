-- Creates the TechnicianAvailability table. Stores weekly availability windows per technician.
-- DayofWeek: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday (ISODOW, weekdays only).
-- Depends on: Technician
CREATE TABLE IF NOT EXISTS public."TechnicianAvailability" (
    "TechnicianID"  UUID        NOT NULL,
    "DayofWeek"     INTEGER     NOT NULL,
    "StartTime"     TIMETZ      NULL,
    "EndTime"       TIMETZ      NULL,

    CONSTRAINT "TechnicianAvailability_pkey" PRIMARY KEY ("TechnicianID", "DayofWeek"),
    CONSTRAINT "chk_weekday" CHECK ("DayofWeek" BETWEEN 1 AND 5),
    CONSTRAINT "chk_end_after_start" CHECK ("EndTime" > "StartTime"),
    CONSTRAINT "fk_techid" FOREIGN KEY ("TechnicianID") REFERENCES public."Technician"(id)
);
