"""
Pydantic schemas for the Freight Ops Copilot chat API.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatRole(str, Enum):
    user = "user"
    assistant = "assistant"


# ---------- Requests ----------

class ChatRequest(BaseModel):
    """
    Body for POST /api/chat.

    session_id is optional — omit it to start a new conversation.
    History is NOT sent by the client; it's loaded server-side from the
    session so it can't be spoofed and stays consistent with what was
    actually persisted (and actually shown to the LLM).
    """
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: UUID | None = None

    @field_validator("message")
    @classmethod
    def strip_and_validate(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message cannot be empty")
        return v


# ---------- Responses ----------

class ChatResponse(BaseModel):
    session_id: UUID
    message: str
    created_at: datetime


class ChatMessageOut(BaseModel):
    id: UUID
    role: ChatRole
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionOut(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionListResponse(BaseModel):
    sessions: list[ChatSessionOut]


class ChatHistoryResponse(BaseModel):
    session: ChatSessionOut
    messages: list[ChatMessageOut]