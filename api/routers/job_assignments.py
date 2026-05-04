# CRUD endpoints for the JobAssignment junction table.
# JobAssignment has a composite PK of (JobId, TechnicianId).

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional
import asyncpg

from database import get_connection
from schemas.job_assignment import (
    JobAssignmentCreate,
    JobAssignmentUpdate,
    JobAssignmentResponse,
)

router = APIRouter()


@router.get("/", response_model=List[JobAssignmentResponse])
async def list_job_assignments(
    job_id: Optional[UUID] = None,
    technician_id: Optional[UUID] = None,
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[JobAssignmentResponse]:
    """
    Returns all job assignments, with optional filtering by job or technician.

    Args:
        job_id: Optional filter — return only assignments for this job UUID.
        technician_id: Optional filter — return only assignments for this technician UUID.
        connection: Injected asyncpg database connection.

    Returns:
        List of JobAssignmentResponse objects.
    """
    base_query = 'SELECT "JobId", "TechnicianId", "JobStartTime", "JobEndDate" FROM public."JobAssignment"'
    conditions: list[str] = []
    parameters: list = []

    if job_id is not None:
        parameters.append(job_id)
        conditions.append(f'"JobId" = ${len(parameters)}')

    if technician_id is not None:
        parameters.append(technician_id)
        conditions.append(f'"TechnicianId" = ${len(parameters)}')

    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)

    base_query += ' ORDER BY "JobStartTime"'
    records = await connection.fetch(base_query, *parameters)
    return [JobAssignmentResponse(**dict(record)) for record in records]


@router.get("/{job_id}/{technician_id}", response_model=JobAssignmentResponse)
async def get_job_assignment(
    job_id: UUID,
    technician_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobAssignmentResponse:
    """
    Fetches a single JobAssignment by its composite primary key.

    Args:
        job_id: UUID of the job in the assignment.
        technician_id: UUID of the technician in the assignment.
        connection: Injected asyncpg database connection.

    Returns:
        JobAssignmentResponse for the matching record.

    Raises:
        HTTPException 404: If no matching assignment exists.
    """
    record = await connection.fetchrow(
        """
        SELECT "JobId", "TechnicianId", "JobStartTime", "JobEndDate"
        FROM public."JobAssignment"
        WHERE "JobId" = $1 AND "TechnicianId" = $2
        """,
        job_id,
        technician_id,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job assignment not found.")
    return JobAssignmentResponse(**dict(record))


@router.post("/", response_model=JobAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_job_assignment(
    payload: JobAssignmentCreate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobAssignmentResponse:
    """
    Creates a new JobAssignment linking a technician to a job.

    Args:
        payload: JobAssignmentCreate body with JobId, TechnicianId, and optional timestamps.
        connection: Injected asyncpg database connection.

    Returns:
        The newly created JobAssignmentResponse.

    Raises:
        HTTPException 404: If the referenced job or technician does not exist.
        HTTPException 409: If the assignment already exists (duplicate composite key).
    """
    try:


        # Prevent an Assignment if the Job is Already Assigned
        record = await connection.fetchrow(
            """
            SELECT * 
              FROM public."JobAssignment" 
             WHERE "JobId" = $1
            """,
            payload.job_id 
        )

        if(record):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This Job is Already Assigned"
            )

        # Prevent an Assignment if the Technician is Unavailable on that Day
        record = await connection.fetchrow(
            """    
            SELECT "id" FROM public."Job"
             WHERE id = $1 
               AND EXTRACT(ISODOW FROM "StartTime") IN (SELECT "DayofWeek"
  											              FROM public."TechnicianAvailability" AS TA
											             WHERE TA."TechnicianID" = $2 )
 
            """,
            payload.job_id,
            payload.technician_id
            
        )

        if(not record):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The Technician is unavailable on this day"
            )





        # Prevent an Assignment if the Technician is Already Assigned a job during those hours.
        #record = await connection.fetchrow(
        #    """"""
        #)

        record = await connection.fetchrow(
            """
            INSERT INTO public."JobAssignment" ("JobId", "TechnicianId", "JobStartTime", "JobEndDate")
            VALUES ($1, $2, $3, $4)
            RETURNING *
            """,
            payload.job_id,
            payload.technician_id,
            payload.job_start_time,
            payload.job_end_date,
        )

    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced job or technician does not exist.",
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This technician is already assigned to the specified job.",
        )
    return JobAssignmentResponse(**dict(record))


@router.put("/{job_id}/{technician_id}", response_model=JobAssignmentResponse)
async def update_job_assignment(
    job_id: UUID,
    technician_id: UUID,
    payload: JobAssignmentUpdate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> JobAssignmentResponse:
    """
    Updates the timestamps on an existing JobAssignment.
    The composite key (JobId, TechnicianId) is immutable and cannot be changed.

    Args:
        job_id: UUID of the job in the assignment.
        technician_id: UUID of the technician in the assignment.
        payload: JobAssignmentUpdate body with optional JobStartTime and JobEndDate.
        connection: Injected asyncpg database connection.

    Returns:
        The updated JobAssignmentResponse.

    Raises:
        HTTPException 404: If no matching assignment exists.
    """
    record = await connection.fetchrow(
        """
        UPDATE public."JobAssignment"
        SET "JobStartTime" = $3, "JobEndDate" = $4
        WHERE "JobId" = $1 AND "TechnicianId" = $2
        RETURNING *
        """,
        job_id,
        technician_id,
        payload.job_start_time,
        payload.job_end_date,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job assignment not found.")
    return JobAssignmentResponse(**dict(record))


@router.delete("/{job_id}/{technician_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_assignment(
    job_id: UUID,
    technician_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    """
    Removes a JobAssignment by its composite primary key.

    Args:
        job_id: UUID of the job in the assignment.
        technician_id: UUID of the technician in the assignment.
        connection: Injected asyncpg database connection.

    Raises:
        HTTPException 404: If no matching assignment exists.
    """
    result = await connection.execute(
        'DELETE FROM public."JobAssignment" WHERE "JobId" = $1 AND "TechnicianId" = $2',
        job_id,
        technician_id,
    )
    rows_deleted = int(result.split()[-1])
    if rows_deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job assignment not found.")
