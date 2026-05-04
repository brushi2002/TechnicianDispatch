# CRUD endpoints for the Job entity, plus a dedicated endpoint for assigning
# a technician to a job and a sub-resource route to list a job's assignments.

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID, uuid4
from typing import List
import asyncpg

from database import get_connection
from schemas.job import JobCreate, JobUpdate, JobResponse
from schemas.job_assignment import AssignTechnicianPayload, JobAssignmentResponse

router = APIRouter()


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[JobResponse]:
    """
    Returns all jobs ordered alphabetically by Name.

    Args:
        connection: Injected asyncpg database connection.

    Returns:
        List of JobResponse objects.
    """
    records = await connection.fetch(
        'SELECT id, "Name", "DurationInHours", "StartTime" FROM public."Job" ORDER BY "Name"'
    )
    return [JobResponse(**dict(record)) for record in records]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobResponse:
    """
    Fetches a single Job by its UUID primary key.

    Args:
        job_id: UUID of the job to retrieve.
        connection: Injected asyncpg database connection.

    Returns:
        JobResponse for the matching record.

    Raises:
        HTTPException 404: If no job with the given id exists.
    """
    record = await connection.fetchrow(
        'SELECT id, "Name", "DurationInHours", "StartTime" FROM public."Job" WHERE id = $1',
        job_id,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return JobResponse(**dict(record))


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobResponse:
    """
    Creates a new Job. The id is generated server-side.

    Args:
        payload: JobCreate body with Name, DurationInHours, and StartTime.
        connection: Injected asyncpg database connection.

    Returns:
        The newly created JobResponse including the generated id.
    """
    new_id = uuid4()
    record = await connection.fetchrow(
        'INSERT INTO public."Job" (id, "Name", "DurationInHours", "StartTime") VALUES ($1, $2, $3, $4) RETURNING *',
        new_id,
        payload.name,
        payload.duration_in_hours,
        payload.start_time,
    )
    return JobResponse(**dict(record))


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    payload: JobUpdate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobResponse:
    """
    Partially updates a Job. Only non-None payload fields are written to the database.

    Args:
        job_id: UUID of the job to update.
        payload: JobUpdate body; all fields are optional.
        connection: Injected asyncpg database connection.

    Returns:
        The updated JobResponse.

    Raises:
        HTTPException 400: If the payload contains no updatable fields.
        HTTPException 404: If no job with the given id exists.
    """
    # Build SET clause from whichever fields the caller actually provided
    # Column names come from Pydantic alias constants, not user input — no injection risk
    fields_to_update = {
        key: value
        for key, value in payload.model_dump(by_alias=True).items()
        if value is not None
    }
    if not fields_to_update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update.",
        )

    set_clauses = [
        f'"{column}" = ${index + 2}'
        for index, column in enumerate(fields_to_update.keys())
    ]
    query = f'UPDATE public."Job" SET {", ".join(set_clauses)} WHERE id = $1 RETURNING *'
    record = await connection.fetchrow(query, job_id, *fields_to_update.values())

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return JobResponse(**dict(record))


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    """
    Deletes a Job by UUID. Returns 204 No Content on success.
    The schema has no ON DELETE CASCADE; remove related JobAssignment rows first
    or a 409 Conflict will be returned.

    Args:
        job_id: UUID of the job to delete.
        connection: Injected asyncpg database connection.

    Raises:
        HTTPException 404: If no job with the given id exists.
        HTTPException 409: If a foreign-key constraint prevents deletion.
    """
    try:
        result = await connection.execute(
            'DELETE FROM public."Job" WHERE id = $1',
            job_id,
        )
    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete job: related assignment records exist.",
        )

    rows_deleted = int(result.split()[-1])
    if rows_deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")


@router.post("/{job_id}/assign", response_model=JobAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def assign_technician_to_job(
    job_id: UUID,
    payload: AssignTechnicianPayload,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobAssignmentResponse:
    """
    Assigns a technician to a job. Validates that both the job and the technician
    exist before creating the assignment record.

    Args:
        job_id: UUID of the job to assign the technician to.
        payload: AssignTechnicianPayload with technician_id and optional timestamps.
        connection: Injected asyncpg database connection.

    Returns:
        The newly created JobAssignmentResponse.

    Raises:
        HTTPException 404: If the job or technician does not exist.
        HTTPException 409: If the technician is already assigned to this job.
    """
    # Verify the job exists
    job_exists = await connection.fetchval(
        'SELECT 1 FROM public."Job" WHERE id = $1',
        job_id,
    )
    if not job_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    # Verify the technician exists
    technician_exists = await connection.fetchval(
        'SELECT 1 FROM public."Technician" WHERE id = $1',
        payload.technician_id,
    )
    if not technician_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found.")

    # Verify the technician's availability window covers the job's time window
    is_available = await connection.fetchval(
        """
        SELECT 1 FROM public."Job" AS J
        INNER JOIN public."TechnicianAvailability" TA
            ON TA."TechnicianID" = $2
            AND TA."DayofWeek" = EXTRACT(ISODOW FROM J."StartTime")
        WHERE J.id = $1
            AND tstzrange(J."StartTime", J."StartTime" + J."DurationInHours" * interval '1 hour')
                <@ tstzrange(
                    J."StartTime"::date + TA."StartTime",
                    J."StartTime"::date + TA."EndTime"
                )
        """,
        job_id,
        payload.technician_id,
    )
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Technician is not available for this job's time window.",
        )

    try:
        record = await connection.fetchrow(
            """
            INSERT INTO public."JobAssignment" ("JobId", "TechnicianId", "JobStartTime", "JobEndDate")
            VALUES ($1, $2, $3, $4)
            RETURNING *
            """,
            job_id,
            payload.technician_id,
            payload.job_start_time,
            payload.job_end_date,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This technician is already assigned to the specified job.",
        )
    return JobAssignmentResponse(**dict(record))


@router.get("/{job_id}/assignments", response_model=List[JobAssignmentResponse])
async def get_job_assignments(
    job_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[JobAssignmentResponse]:
    """
    Returns all technician assignments for a specific job.

    Args:
        job_id: UUID of the job whose assignments to retrieve.
        connection: Injected asyncpg database connection.

    Returns:
        List of JobAssignmentResponse objects.
    """
    records = await connection.fetch(
        """
        SELECT "JobId", "TechnicianId", "JobStartTime", "JobEndDate"
        FROM public."JobAssignment"
        WHERE "JobId" = $1
        ORDER BY "JobStartTime"
        """,
        job_id,
    )
    return [JobAssignmentResponse(**dict(record)) for record in records]
