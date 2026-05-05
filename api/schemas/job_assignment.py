# Pydantic request/response models for the JobAssignment junction table.
# JobAssignment has a composite PK of (JobId, TechnicianId); neither key is updatable.

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime



class AssignTechnicianPayload(BaseModel):
    """
    Payload for the dedicated POST /jobs/{job_id}/assign endpoint.

    Attributes:
        technician_id: UUID of the Technician to assign to the job.
    """
    technician_id: UUID


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
