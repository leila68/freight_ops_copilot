from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Setting, User
from app.schemas.setting import SettingResponse, SettingUpdate
from app.api.auth import get_current_user


router = APIRouter(tags=["settings"])


def require_staff(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required."
        )
    return current_user


@router.get("/settings", response_model=list[SettingResponse])
def list_settings(
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    return db.query(Setting).all()


@router.put("/settings/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    setting = (
        db.query(Setting)
        .filter(Setting.key == key)
        .first()
    )

    if not setting:
        raise HTTPException(
            status_code=404,
            detail="Setting not found"
        )

    setting.value = payload.value

    db.commit()
    db.refresh(setting)

    return setting