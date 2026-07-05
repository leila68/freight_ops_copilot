"""
Quote endpoints:
- POST /quotes/preview  — calculate breakdown, does NOT save to DB
- POST /quotes/book     — calculate + save quote to DB
- GET  /quotes          — list quotes (scoped by role)
"""
import json
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Lane, EquipmentType, Accessorial, Quote, QuoteAccessorial, Setting
from app.schemas.quotes import (
    QuoteCalculateRequest,
    QuoteBreakdownResponse,
    QuoteResponse,
    AccessorialLineItem,
)
from app.api.auth import get_current_user

router = APIRouter(tags=["quotes"])

WEIGHT_THRESHOLD_LBS = 10_000
WEIGHT_EXTRA_PER_100_LBS = Decimal("0.10")


def get_fuel_surcharge(db: Session) -> Decimal:
    setting = db.query(Setting).filter(Setting.key == "fuel_surcharge_percent").first()
    return Decimal(setting.value) if setting else Decimal("8.00")


def _calculate_breakdown(
    payload: QuoteCalculateRequest,
    db: Session,
) -> tuple[QuoteBreakdownResponse, Lane, EquipmentType]:
    """
    Shared calculation logic used by both /preview and /book.
    Returns the breakdown plus the lane and equipment objects
    so /book can use them without re-querying.
    """
    # 1. Find matching lane
    lane = db.query(Lane).filter(
        Lane.origin_city.ilike(payload.origin_city),
        Lane.origin_province.ilike(payload.origin_province),
        Lane.destination_city.ilike(payload.destination_city),
        Lane.destination_province.ilike(payload.destination_province),
        Lane.is_active == True,
    ).first()

    if not lane:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No lane found for {payload.origin_city}, {payload.origin_province} "
                f"→ {payload.destination_city}, {payload.destination_province}. "
                f"Please contact us for a custom quote."
            ),
        )

    # 2. Find equipment type
    equipment = db.query(EquipmentType).filter(
        EquipmentType.id == payload.equipment_type_id,
        EquipmentType.is_active == True,
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment type not found.")

    # 3. Rate components
    base_rate = Decimal(str(lane.base_rate))
    multiplier = Decimal(str(equipment.multiplier))
    equipment_adjustment = base_rate * (multiplier - 1)

    weight = Decimal(str(payload.total_weight))
    if weight > WEIGHT_THRESHOLD_LBS:
        excess_lbs = weight - WEIGHT_THRESHOLD_LBS
        weight_adjustment = (excess_lbs / 100) * WEIGHT_EXTRA_PER_100_LBS
        weight_factor = Decimal("1") + (weight_adjustment / base_rate)
    else:
        weight_adjustment = Decimal("0")
        weight_factor = Decimal("1")

    fuel_pct = get_fuel_surcharge(db)
    fuel_surcharge = base_rate * (fuel_pct / 100)

    # 4. Accessorials
    accessorial_items: list[AccessorialLineItem] = []
    accessorials_total = Decimal("0")

    if payload.accessorial_ids:
        accessorials = db.query(Accessorial).filter(
            Accessorial.id.in_([str(a) for a in payload.accessorial_ids]),
            Accessorial.is_active == True,
        ).all()

        for acc in accessorials:
            fee = (
                Decimal(str(acc.amount))
                if acc.charge_type == "flat"
                else base_rate * (Decimal(str(acc.amount)) / 100)
            )
            accessorial_items.append(
                AccessorialLineItem(id=acc.id, name=acc.name, fee=fee)
            )
            accessorials_total += fee

    # 5. Total
    total = (
        base_rate
        + equipment_adjustment
        + weight_adjustment
        + fuel_surcharge
        + accessorials_total
    ).quantize(Decimal("0.01"))

    breakdown = QuoteBreakdownResponse(
        base_rate=base_rate,
        equipment_multiplier=multiplier,
        equipment_adjustment=equipment_adjustment.quantize(Decimal("0.01")),
        weight_factor=weight_factor.quantize(Decimal("0.0001")),
        weight_adjustment=weight_adjustment.quantize(Decimal("0.01")),
        fuel_surcharge=fuel_surcharge.quantize(Decimal("0.01")),
        accessorials=accessorial_items,
        total=total,
    )

    return breakdown, lane, equipment


@router.post("/quotes/preview", response_model=QuoteBreakdownResponse)
def preview_quote(
    payload: QuoteCalculateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Calculate a quote breakdown without saving anything to DB.
    Used to show the customer a preview before they confirm.
    """
    breakdown, _, _ = _calculate_breakdown(payload, db)
    return breakdown


@router.post("/quotes/book", response_model=QuoteBreakdownResponse, status_code=201)
def book_quote(
    payload: QuoteCalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate + save the quote to DB.
    Called only when the customer confirms the preview.
    """
    breakdown, lane, equipment = _calculate_breakdown(payload, db)

    quote = Quote(
        customer_id=current_user.id,
        lane_id=lane.id,
        equipment_type_id=equipment.id,
        total_weight=Decimal(str(payload.total_weight)),
        pickup_date=payload.pickup_date,
        status="pending",
        base_rate=breakdown.base_rate,
        equipment_adjustment=breakdown.equipment_adjustment,
        weight_adjustment=breakdown.weight_adjustment,
        fuel_surcharge=breakdown.fuel_surcharge,
        accessorials_total=sum(a.fee for a in breakdown.accessorials),
        total_price=breakdown.total,
        breakdown_json=json.dumps({
            "base_rate": str(breakdown.base_rate),
            "equipment_multiplier": str(breakdown.equipment_multiplier),
            "equipment_adjustment": str(breakdown.equipment_adjustment),
            "weight_factor": str(breakdown.weight_factor),
            "weight_adjustment": str(breakdown.weight_adjustment),
            "fuel_surcharge": str(breakdown.fuel_surcharge),
            "accessorials": [
                {"id": str(a.id), "name": a.name, "fee": str(a.fee)}
                for a in breakdown.accessorials
            ],
            "total": str(breakdown.total),
        }),
    )
    db.add(quote)
    db.flush()

    for item in breakdown.accessorials:
        db.add(QuoteAccessorial(
            quote_id=quote.id,
            accessorial_id=item.id,
            fee_applied=item.fee,
        ))

    db.commit()
    return breakdown


@router.get("/quotes", response_model=list[QuoteResponse])
def list_quotes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Quote)

    if current_user.role == "customer":
        query = query.filter(Quote.customer_id == current_user.id)

    quotes = query.order_by(Quote.created_at.desc()).all()

    result = []
    for q in quotes:
        breakdown = None
        if q.breakdown_json:
            raw = json.loads(q.breakdown_json)
            breakdown = QuoteBreakdownResponse(
                base_rate=Decimal(raw["base_rate"]),
                equipment_multiplier=Decimal(raw["equipment_multiplier"]),
                equipment_adjustment=Decimal(raw["equipment_adjustment"]),
                weight_factor=Decimal(raw["weight_factor"]),
                weight_adjustment=Decimal(raw["weight_adjustment"]),
                fuel_surcharge=Decimal(raw["fuel_surcharge"]),
                accessorials=[
                    AccessorialLineItem(**a) for a in raw["accessorials"]
                ],
                total=Decimal(raw["total"]),
            )

        result.append(QuoteResponse(
            id=q.id,
            customer_id=q.customer_id,
            customer_name=q.customer.full_name if current_user.role == "staff" else None,
            origin=f"{q.lane.origin_city}, {q.lane.origin_province}",
            destination=f"{q.lane.destination_city}, {q.lane.destination_province}",
            equipment_type=q.equipment_type.name,
            total_weight=q.total_weight,
            pickup_date=q.pickup_date,
            status=q.status,
            total_price=q.total_price,
            created_at=q.created_at,
            breakdown=breakdown,
        ))

    return result