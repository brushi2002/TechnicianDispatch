# Pydantic request/response models for the JobAssignment junction table.
# JobAssignment has a composite PK of (JobId, TechnicianId); neither key is updatable.

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime


class JobAssignmentCreate(BaseModel):
    """
    Payload required to create a new JobAssignment.
    Both foreign keys are required; timestamps are optional since an assignment
    may be created before a specific time is locked in.

    Attributes:
        job_id: UUID of the related Job.
        technician_id: UUID of the assigned Technician.
        job_start_time: Optional scheduled start time.
        job_end_date: Optional scheduled end time.
    """
    job_id: UUID = Field(..., alias="JobId")
    technician_id: UUID = Field(..., alias="TechnicianId")
    job_start_time: Optional[datetime] = Field(None, alias="JobStartTime")
    job_end_date: Optional[datetime] = Field(None, alias="JobEndDate")

    model_config = {"populate_by_name": True}


class JobAssignmentUpdate(BaseModel):
    """
    Payload for updating an existing JobAssignment.
    The composite key (JobId, TechnicianId) is immutable; only timestamps can change.

    Attributes:
        job_start_time: Updated scheduled start time.
        job_end_date: Updated scheduled end time.
    """
    job_start_time: Optional[datetime] = Field(None, alias="JobStartTime")
    job_end_date: Optional[datetime] = Field(None, alias="JobEndDate")

    model_config = {"populate_by_name": True}


class AssignTechnicianPayload(BaseModel):
    """
    Payload for the dedicated POST /jobs/{job_id}/assign endpoint.

    Attributes:
        technician_id: UUID of the Technician to assign to the job.
        job_start_time: Optional scheduled start time for the assignment.
        job_end_date: Optional scheduled end time for the assignment.
    """
    technician_id: UUID
    job_start_time: Optional[datetime] = None
    job_end_date: Optional[datetime] = None


class JobAssignmentResponse(BaseModel):
    """
    Serialized JobAssignment returned to API clients.

    Attributes:
        job_id: UUID of the related Job.
        technician_id: UUID of the assigned Technician.
        job_start_time: Scheduled start time.
        job_end_date: Scheduled end time.
    """
    job_id: UUID = Field(alias="JobId")
    technician_id: UUID = Field(alias="TechnicianId")
    job_start_time: Optional[datetime] = Field(None, alias="JobStartTime")
    job_end_date: Optional[datetime] = Field(None, alias="JobEndDate")

    model_config = {"populate_by_name": True, "from_attributes": True}
