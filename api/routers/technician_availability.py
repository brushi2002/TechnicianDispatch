# CRUD endpoints for the TechnicianAvailability entity.
# This table has a composite PK of (TechnicianID, DayofWeek).

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional
import asyncpg

from database import get_connection
from schemas.technician_availability import (
    TechnicianAvailabilityCreate,
    TechnicianAvailabilityUpdate,
    TechnicianAvailabilityResponse,
)

router = APIRouter()


@router.get("/", response_model=List[TechnicianAvailabilityResponse])
async def list_technician_availability(
    technician_id: Optional[UUID] = None,
    day_of_week: Optional[int] = None,
    connection: asyncpg.Connection = Depends(get_connection),
) -> List[TechnicianAvailabilityResponse]:
    """
    Returns all availability slots, with optional filtering by technician or day of week.

    Args:
        technician_id: Optional filter — return only slots for this technician UUID.
        day_of_week: Optional filter — return only slots for this day (0=Sunday, 6=Saturday).
        connection: Injected asyncpg database connection.

    Returns:
        List of TechnicianAvailabilityResponse objects.
    """
    base_query = 'SELECT "TechnicianID", "DayofWeek", "StartTime", "EndTime" FROM public."TechnicianAvailability"'
    conditions: list[str] = []
    parameters: list = []

    if technician_id is not None:
        parameters.append(technician_id)
        conditions.append(f'"TechnicianID" = ${len(parameters)}')

    if day_of_week is not None:
        parameters.append(day_of_week)
        conditions.append(f'"DayofWeek" = ${len(parameters)}')

    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)

    base_query += ' ORDER BY "TechnicianID", "DayofWeek"'
    records = await connection.fetch(base_query, *parameters)
    return [TechnicianAvailabilityResponse(**dict(record)) for record in records]


@router.get("/{technician_id}/{day_of_week}", response_model=TechnicianAvailabilityResponse)
async def get_technician_availability_slot(
    technician_id: UUID,
    day_of_week: int,
    connection: asyncpg.Connection = Depends(get_connection),
) -> TechnicianAvailabilityResponse:
    """
    Fetches a single availability slot by its composite primary key.

    Args:
        technician_id: UUID of the technician.
        day_of_week: Day integer (0=Sunday through 6=Saturday).
        connection: Injected asyncpg database connection.

    Returns:
        TechnicianAvailabilityResponse for the matching record.

    Raises:
        HTTPException 404: If no matching availability slot exists.
    """
    record = await connection.fetchrow(
        """
        SELECT "TechnicianID", "DayofWeek", "StartTime", "EndTime"
        FROM public."TechnicianAvailability"
        WHERE "TechnicianID" = $1 AND "DayofWeek" = $2
        """,
        technician_id,
        day_of_week,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found.")
    return TechnicianAvailabilityResponse(**dict(record))


@router.post("/", response_model=TechnicianAvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_technician_availability(
    payload: TechnicianAvailabilityCreate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> TechnicianAvailabilityResponse:
    """
    Creates a new availability slot for a technician on a given day.

    Args:
        payload: TechnicianAvailabilityCreate body with TechnicianID, DayofWeek, and optional times.
        connection: Injected asyncpg database connection.

    Returns:
        The newly created TechnicianAvailabilityResponse.

    Raises:
        HTTPException 404: If the referenced technician does not exist.
        HTTPException 409: If a slot for that technician+day already exists.
    """
    try:
        record = await connection.fetchrow(
            """
            INSERT INTO public."TechnicianAvailability" ("TechnicianID", "DayofWeek", "StartTime", "EndTime")
            VALUES ($1, $2, $3, $4)
            RETURNING *
            """,
            payload.technician_id,
            payload.day_of_week,
            payload.start_time,
            payload.end_time,
        )
    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced technician does not exist.",
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An availability slot for this technician and day already exists.",
        )
    return TechnicianAvailabilityResponse(**dict(record))


@router.put("/{technician_id}/{day_of_week}", response_model=TechnicianAvailabilityResponse)
async def update_technician_availability(
    technician_id: UUID,
    day_of_week: int,
    payload: TechnicianAvailabilityUpdate,
    connection: asyncpg.Connection = Depends(get_connection),
) -> TechnicianAvailabilityResponse:
    """
    Updates the time window for an existing availability slot.
    The composite key (TechnicianID, DayofWeek) is immutable.

    Args:
        technician_id: UUID of the technician.
        day_of_week: Day integer (0=Sunday through 6=Saturday).
        payload: TechnicianAvailabilityUpdate body with optional StartTime and EndTime.
        connection: Injected asyncpg database connection.

    Returns:
        The updated TechnicianAvailabilityResponse.

    Raises:
        HTTPException 404: If no matching availability slot exists.
    """
    record = await connection.fetchrow(
        """
        UPDATE public."TechnicianAvailability"
        SET "StartTime" = $3, "EndTime" = $4
        WHERE "TechnicianID" = $1 AND "DayofWeek" = $2
        RETURNING *
        """,
        technician_id,
        day_of_week,
        payload.start_time,
        payload.end_time,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found.")
    return TechnicianAvailabilityResponse(**dict(record))


@router.delete("/{technician_id}/{day_of_week}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_technician_availability(
    technician_id: UUID,
    day_of_week: int,
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    """
    Deletes an availability slot by its composite primary key.

    Args:
        technician_id: UUID of the technician.
        day_of_week: Day integer (0=Sunday through 6=Saturday).
        connection: Injected asyncpg database connection.

    Raises:
        HTTPException 404: If no matching availability slot exists.
    """
    result = await connection.execute(
        'DELETE FROM public."TechnicianAvailability" WHERE "TechnicianID" = $1 AND "DayofWeek" = $2',
        technician_id,
        day_of_week,
    )
    rows_deleted = int(result.split()[-1])
    if rows_deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found.")
