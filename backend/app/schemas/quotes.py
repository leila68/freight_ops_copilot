"""
Pydantic schemas for quote calculation and retrieval.
"""
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class QuoteCalculateRequest(BaseModel):
    origin_city: str
    origin_province: str
    destination_city: str
    destination_province: str
    equipment_type_id: UUID
    total_weight: float = Field(gt=0)
    pickup_date: date
    accessorial_ids: list[UUID] = []


class AccessorialLineItem(BaseModel):
    id: UUID
    name: str
    fee: Decimal


class QuoteBreakdownResponse(BaseModel):
    base_rate: Decimal
    equipment_multiplier: Decimal
    equipment_adjustment: Decimal
    weight_factor: Decimal
    weight_adjustment: Decimal
    fuel_surcharge_percent: Decimal
    fuel_surcharge: Decimal
    accessorials: list[AccessorialLineItem]
    total: Decimal


class QuoteResponse(BaseModel):
    id: UUID
    customer_id: UUID
    customer_name: str | None
    origin: str
    destination: str
    equipment_type: str
    total_weight: Decimal
    pickup_date: date
    status: str
    total_price: Decimal
    created_at: datetime
    breakdown: QuoteBreakdownResponse | None = None

    class Config:
        from_attributes = True