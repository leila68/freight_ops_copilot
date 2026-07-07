"""
Pydantic schemas for application settings.
"""

from pydantic import BaseModel


class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    key: str
    value: str
    description: str | None = None

    class Config:
        from_attributes = True