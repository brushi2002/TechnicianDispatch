# CRUD endpoints for the JobAssignment junction table.
# JobAssignment has a composite PK of (JobId, TechnicianId).
# Use POST /api/v1/jobs/{job_id}/assign to create assignments — it enforces
# availability and conflict validation before inserting.

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional
import asyncpg

from database import get_connection
from schemas.job_assignment import (
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
