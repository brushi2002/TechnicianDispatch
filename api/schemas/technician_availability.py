# Pydantic request/response models for the TechnicianAvailability entity.
# This table has a composite PK of (TechnicianID, DayofWeek).

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import time


class TechnicianAvailabilityCreate(BaseModel):
    """
    Payload required to create a new availability slot.

    Attributes:
        technician_id: UUID of the owning Technician.
        day_of_week: Integer 0 (Sunday) through 6 (Saturday).
        start_time: Start of the availability window (time with timezone).
        end_time: End of the availability window (time with timezone).
    """
    technician_id: UUID = Field(..., alias="TechnicianID")
    day_of_week: int = Field(..., ge=0, le=6, alias="DayofWeek")
    start_time: Optional[time] = Field(None, alias="StartTime")
    end_time: Optional[time] = Field(None, alias="EndTime")

    model_config = {"populate_by_name": True}


class TechnicianAvailabilityUpdate(BaseModel):
    """
    Payload for updating the time window of an existing availability slot.
    The composite key (TechnicianID, DayofWeek) is immutable.

    Attributes:
        start_time: Updated start of the availability window.
        end_time: Updated end of the availability window.
    """
    start_time: Optional[time] = Field(None, alias="StartTime")
    end_time: Optional[time] = Field(None, alias="EndTime")

    model_config = {"populate_by_name": True}


class TechnicianAvailabilityResponse(BaseModel):
    """
    Serialized TechnicianAvailability returned to API clients.

    Attributes:
        technician_id: UUID of the owning Technician.
        day_of_week: Day integer (0=Sunday, 6=Saturday).
        start_time: Start of the availability window.
        end_time: End of the availability window.
    """
    technician_id: UUID = Field(alias="TechnicianID")
    day_of_week: int = Field(alias="DayofWeek")
    start_time: Optional[time] = Field(None, alias="StartTime")
    end_time: Optional[time] = Field(None, alias="EndTime")

    model_config = {"populate_by_name": True, "from_attributes": True}
