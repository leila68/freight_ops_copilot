"""
Pydantic schemas for freight entities:
equipment types, accessorials, lanes.
"""
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


# --- Equipment Types ---

class EquipmentTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    multiplier: Decimal = Field(gt=0)
    description: str | None = None

class EquipmentTypeResponse(BaseModel):
    id: UUID
    name: str
    multiplier: Decimal
    description: str | None
    is_active: bool

    class Config:
        from_attributes = True


# --- Accessorials ---

class AccessorialCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    charge_type: str = Field(pattern="^(flat|percent)$")
    amount: Decimal = Field(gt=0)
    description: str | None = None

class AccessorialResponse(BaseModel):
    id: UUID
    name: str
    charge_type: str
    amount: Decimal
    description: str | None
    is_active: bool

    class Config:
        from_attributes = True


# --- Lanes ---

class LaneCreate(BaseModel):
    origin_city: str = Field(min_length=1, max_length=100)
    origin_province: str = Field(min_length=2, max_length=10)
    destination_city: str = Field(min_length=1, max_length=100)
    destination_province: str = Field(min_length=2, max_length=10)
    base_rate: Decimal = Field(gt=0)
    distance_km: int = Field(gt=0)
    transit_days: int = Field(gt=0, default=1)

class LaneResponse(BaseModel):
    id: UUID
    origin_city: str
    origin_province: str
    destination_city: str
    destination_province: str
    base_rate: Decimal
    distance_km: int
    transit_days: int
    is_active: bool

    class Config:
        from_attributes = True