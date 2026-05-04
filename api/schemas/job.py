# Pydantic request/response models for the Job entity.

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime


class JobCreate(BaseModel):
    """
    Payload required to create a new Job.

    Attributes:
        name: Descriptive name for the job (max 50 characters).
        duration_in_hours: Estimated job duration; must be a positive integer.
        start_time: Scheduled start time for the job.
    """
    name: Optional[str] = Field(None, max_length=50, alias="Name")
    duration_in_hours: int = Field(..., gt=0, alias="DurationInHours")
    start_time: datetime = Field(..., alias="StartTime")

    model_config = {"populate_by_name": True}


class JobUpdate(BaseModel):
    """
    Payload for a partial update to a Job.
    All fields are optional; only non-None fields are written to the database.

    Attributes:
        name: Updated job name.
        duration_in_hours: Updated duration in hours.
        start_time: Updated scheduled start time.
    """
    name: Optional[str] = Field(None, max_length=50, alias="Name")
    duration_in_hours: Optional[int] = Field(None, gt=0, alias="DurationInHours")
    start_time: Optional[datetime] = Field(None, alias="StartTime")

    model_config = {"populate_by_name": True}


class JobResponse(BaseModel):
    """
    Serialized Job returned to API clients.

    Attributes:
        id: UUID primary key.
        name: Job name.
        duration_in_hours: Duration in hours.
        start_time: Scheduled start datetime.
    """
    id: UUID
    name: Optional[str] = Field(None, alias="Name")
    duration_in_hours: int = Field(alias="DurationInHours")
    start_time: datetime = Field(alias="StartTime")

    model_config = {"populate_by_name": True, "from_attributes": True}
