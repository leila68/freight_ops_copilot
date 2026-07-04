"""
Freight endpoints: equipment types, accessorials, lanes.
All write operations (create, update, delete) are staff-only.
List endpoints are accessible to any authenticated user.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import EquipmentType, Accessorial, Lane
from app.schemas.freight import (
    EquipmentTypeCreate, EquipmentTypeResponse,
    AccessorialCreate, AccessorialResponse,
    LaneCreate, LaneResponse,
)
from app.api.auth import get_current_user
from app.db.models import User

router = APIRouter(tags=["freight"])


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that rejects non-staff users with a 403."""
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required."
        )
    return current_user


# --- Equipment Types ---

@router.get("/equipment-types", response_model=list[EquipmentTypeResponse])
def list_equipment_types(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(EquipmentType).filter(EquipmentType.is_active == True).all()


@router.post("/equipment-types", response_model=EquipmentTypeResponse, status_code=201)
def create_equipment_type(
    payload: EquipmentTypeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    existing = db.query(EquipmentType).filter(EquipmentType.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Equipment type with this name already exists.")
    obj = EquipmentType(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/equipment-types/{id}", response_model=EquipmentTypeResponse)
def update_equipment_type(
    id: UUID,
    payload: EquipmentTypeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = db.query(EquipmentType).filter(EquipmentType.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Equipment type not found.")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/equipment-types/{id}", status_code=204)
def delete_equipment_type(
    id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = db.query(EquipmentType).filter(EquipmentType.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Equipment type not found.")
    obj.is_active = False  # soft delete
    db.commit()


# --- Accessorials ---

@router.get("/accessorials", response_model=list[AccessorialResponse])
def list_accessorials(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Accessorial).filter(Accessorial.is_active == True).all()


@router.post("/accessorials", response_model=AccessorialResponse, status_code=201)
def create_accessorial(
    payload: AccessorialCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    existing = db.query(Accessorial).filter(Accessorial.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Accessorial with this name already exists.")
    obj = Accessorial(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/accessorials/{id}", response_model=AccessorialResponse)
def update_accessorial(
    id: UUID,
    payload: AccessorialCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = db.query(Accessorial).filter(Accessorial.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Accessorial not found.")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/accessorials/{id}", status_code=204)
def delete_accessorial(
    id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = db.query(Accessorial).filter(Accessorial.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Accessorial not found.")
    obj.is_active = False
    db.commit()


# --- Lanes ---

@router.get("/lanes", response_model=list[LaneResponse])
def list_lanes(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Lane).filter(Lane.is_active == True).all()


@router.post("/lanes", response_model=LaneResponse, status_code=201)
def create_lane(
    payload: LaneCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = Lane(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/lanes/{id}", response_model=LaneResponse)
def update_lane(
    id: UUID,
    payload: LaneCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = db.query(Lane).filter(Lane.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Lane not found.")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/lanes/{id}", status_code=204)
def delete_lane(
    id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    obj = db.query(Lane).filter(Lane.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Lane not found.")
    obj.is_active = False
    db.commit()