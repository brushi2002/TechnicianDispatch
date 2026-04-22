-- Creates the Technician table, which is a root entity with no foreign key dependencies.
CREATE TABLE IF NOT EXISTS public."Technician" (
    id             UUID         NOT NULL,
    "Name"         VARCHAR(50)  NOT NULL,
    "Address"      VARCHAR(200) NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY (id)
);
