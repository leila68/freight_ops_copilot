"""
SQLAlchemy ORM models — mirrors all DB tables.
"""
import uuid
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import String, Boolean, DateTime, Date, Numeric, Integer, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    quotes: Mapped[list["Quote"]] = relationship("Quote", back_populates="customer")


class EquipmentType(Base):
    __tablename__ = "equipment_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    multiplier: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    quotes: Mapped[list["Quote"]] = relationship("Quote", back_populates="equipment_type")


class Accessorial(Base):
    __tablename__ = "accessorials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    charge_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'flat' or 'percent'
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class Lane(Base):
    __tablename__ = "lanes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    origin_city: Mapped[str] = mapped_column(String(100), nullable=False)
    origin_province: Mapped[str] = mapped_column(String(10), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_province: Mapped[str] = mapped_column(String(10), nullable=False)
    base_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    distance_km: Mapped[int] = mapped_column(Integer, nullable=False)
    transit_days: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    quotes: Mapped[list["Quote"]] = relationship("Quote", back_populates="lane")


class QuoteAccessorial(Base):
    __tablename__ = "quote_accessorials"

    quote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="CASCADE"), primary_key=True)
    accessorial_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accessorials.id"), primary_key=True)
    fee_applied: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lane_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lanes.id"), nullable=False)
    equipment_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_types.id"), nullable=False)
    total_weight: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    pickup_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'pending'"))
    base_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    equipment_adjustment: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    weight_adjustment: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fuel_surcharge: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    accessorials_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    breakdown_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    customer: Mapped["User"] = relationship("User", back_populates="quotes")
    lane: Mapped["Lane"] = relationship("Lane", back_populates="quotes")
    equipment_type: Mapped["EquipmentType"] = relationship("EquipmentType", back_populates="quotes")
    accessorials: Mapped[list["QuoteAccessorial"]] = relationship("QuoteAccessorial", cascade="all, delete-orphan")
    
class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))