# Pydantic request/response models for the Technician entity.

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class TechnicianCreate(BaseModel):
    """
    Payload required to create a new Technician.
    The id is server-generated; clients must not supply it.

    Attributes:
        name: Full name of the technician (max 50 characters).
        address: Optional mailing address (max 200 characters).
    """
    name: str = Field(..., max_length=50, alias="Name")
    address: Optional[str] = Field(None, max_length=200, alias="Address")

    model_config = {"populate_by_name": True}


class TechnicianUpdate(BaseModel):
    """
    Payload for a partial update to a Technician.
    All fields are optional; only non-None fields will be written to the database.

    Attributes:
        name: Updated name (max 50 characters).
        address: Updated address (max 200 characters).
    """
    name: Optional[str] = Field(None, max_length=50, alias="Name")
    address: Optional[str] = Field(None, max_length=200, alias="Address")

    model_config = {"populate_by_name": True}


class TechnicianResponse(BaseModel):
    """
    Serialized Technician returned to API clients.
    Aliases match the PascalCase column names returned by asyncpg so that
    dict(record) maps directly without manual remapping.

    Attributes:
        id: UUID primary key.
        name: Technician's full name.
        address: Optional mailing address.
    """
    id: UUID
    name: str = Field(alias="Name")
    address: Optional[str] = Field(None, alias="Address")

    model_config = {"populate_by_name": True, "from_attributes": True}
