# CRUD endpoints for the Technician entity, plus sub-resource routes
# for a technician's availability slots and job assignments.

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID, uuid4
from typing import List
import asyncpg

from database import get_connection
from schemas.technician import TechnicianCreate, TechnicianUpdate, TechnicianResponse
from schemas.job_assignment import JobAssignmentResponse
from schemas.technician_availability import TechnicianAvailabilityResponse

router = APIRouter()


@router.get("/", response_model=List[TechnicianResponse])
async def list_technicians(
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[TechnicianResponse]:
    """
    Returns all technicians ordered alphabetically by Name.

    Args:
        connection: Injected asyncpg database connection.

    Returns:
        List of TechnicianResponse objects.
    """
    records = await connection.fetch(
        'SELECT id, "Name", "Address" FROM public."Technician" ORDER BY "Name"'
    )
    return [TechnicianResponse(**dict(record)) for record in records]


@router.get("/{technician_id}", response_model=TechnicianResponse)
async def get_technician(
    technician_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> TechnicianResponse:
    """
    Fetches a single Technician by its UUID primary key.

    Args:
        technician_id: UUID of the technician to retrieve.
        connection: Injected asyncpg database connection.

    Returns:
        TechnicianResponse for the matching record.

    Raises:
        HTTPException 404: If no technician with the given id exists.
    """
    record = await connection.fetchrow(
        'SELECT id, "Name", "Address" FROM public."Technician" WHERE id = $1',
        technician_id,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found.")
    return TechnicianResponse(**dict(record))


@router.post("/", response_model=TechnicianResponse, status_code=status.HTTP_201_CREATED)
async def create_technician(
    payload: TechnicianCreate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> TechnicianResponse:
    """
    Creates a new Technician. The id is generated server-side.

    Args:
        payload: TechnicianCreate body with Name and optional Address.
        connection: Injected asyncpg database connection.

    Returns:
        The newly created TechnicianResponse including the generated id.
    """
    new_id = uuid4()
    record = await connection.fetchrow(
        'INSERT INTO public."Technician" (id, "Name", "Address") VALUES ($1, $2, $3) RETURNING *',
        new_id,
        payload.name,
        payload.address,
    )
    return TechnicianResponse(**dict(record))


@router.patch("/{technician_id}", response_model=TechnicianResponse)
async def update_technician(
    technician_id: UUID,
    payload: TechnicianUpdate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> TechnicianResponse:
    """
    Partially updates a Technician. Only fields present (non-None) in the payload are written;
    omitted fields retain their current database values.

    Args:
        technician_id: UUID of the technician to update.
        payload: TechnicianUpdate body; all fields are optional.
        connection: Injected asyncpg database connection.

    Returns:
        The updated TechnicianResponse.

    Raises:
        HTTPException 400: If the payload contains no updatable fields.
        HTTPException 404: If no technician with the given id exists.
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
    query = f'UPDATE public."Technician" SET {", ".join(set_clauses)} WHERE id = $1 RETURNING *'
    record = await connection.fetchrow(query, technician_id, *fields_to_update.values())

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found.")
    return TechnicianResponse(**dict(record))


@router.delete("/{technician_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_technician(
    technician_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    """
    Deletes a Technician by UUID. Returns 204 No Content on success.
    Note: the schema has no ON DELETE CASCADE, so related JobAssignment and
    TechnicianAvailability rows must be removed first or a 409 will be returned.

    Args:
        technician_id: UUID of the technician to delete.
        connection: Injected asyncpg database connection.

    Raises:
        HTTPException 404: If no technician with the given id exists.
        HTTPException 409: If a foreign-key constraint prevents deletion.
    """
    try:
        result = await connection.execute(
            'DELETE FROM public."Technician" WHERE id = $1',
            technician_id,
        )
    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete technician: related records exist in assignments or availability.",
        )

    # asyncpg returns "DELETE N" — extract the affected row count
    rows_deleted = int(result.split()[-1])
    if rows_deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found.")


@router.get("/{technician_id}/availability", response_model=List[TechnicianAvailabilityResponse])
async def get_technician_availability(
    technician_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[TechnicianAvailabilityResponse]:
    """
    Returns all availability slots for a specific technician, ordered by day of week.

    Args:
        technician_id: UUID of the technician whose availability to retrieve.
        connection: Injected asyncpg database connection.

    Returns:
        List of TechnicianAvailabilityResponse objects.
    """
    records = await connection.fetch(
        """
        SELECT "TechnicianID", "DayofWeek", "StartTime", "EndTime"
        FROM public."TechnicianAvailability"
        WHERE "TechnicianID" = $1
        ORDER BY "DayofWeek"
        """,
        technician_id,
    )
    return [TechnicianAvailabilityResponse(**dict(record)) for record in records]


@router.get("/{technician_id}/assignments", response_model=List[JobAssignmentResponse])
async def get_technician_assignments(
    technician_id: UUID,
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[JobAssignmentResponse]:
    """
    Returns all job assignments for a specific technician, ordered by start time.

    Args:
        technician_id: UUID of the technician whose assignments to retrieve.
        connection: Injected asyncpg database connection.

    Returns:
        List of JobAssignmentResponse objects.
    """
    records = await connection.fetch(
        """
        SELECT "JobId", "TechnicianId", "JobStartTime", "JobEndDate"
        FROM public."JobAssignment"
        WHERE "TechnicianId" = $1
        ORDER BY "JobStartTime"
        """,
        technician_id,
    )
    return [JobAssignmentResponse(**dict(record)) for record in records]
