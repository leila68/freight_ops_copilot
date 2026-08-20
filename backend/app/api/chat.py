"""
Chat endpoints for the Freight Ops Copilot.

Adjust these two imports to match your project's actual dependency module:
    get_db            -> yields a SQLAlchemy Session
    get_current_user   -> resolves the authenticated User from the request
"""

import logging
from uuid import UUID
import os
from datetime import datetime, timezone
from sqlalchemy import func

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.auth import get_current_user
from app.db.models import ChatMessage, ChatSession
from app.db.models import User
from app.ai.agent import run_agent
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageOut,
    ChatRequest,
    ChatResponse,
    ChatSessionListResponse,
    ChatSessionOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# How many prior turns to feed back into the agent as context.
# Keep this bounded so token usage doesn't grow unbounded on long sessions.
MAX_HISTORY_MESSAGES = 20
TITLE_MAX_LEN = 60
CHAT_DAILY_LIMIT = int(os.getenv("CHAT_DAILY_LIMIT", "5"))


def _get_owned_session(
    db: Session, session_id: UUID, current_user: User
) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if session is None:
        # 404, not 403 — don't leak whether the session exists for another user.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found"
        )
    return session


def _make_title(message: str) -> str:
    message = " ".join(message.split())
    if len(message) <= TITLE_MAX_LEN:
        return message
    return message[:TITLE_MAX_LEN].rstrip() + "…"


@router.post("", response_model=ChatResponse)
async def send_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    """
    Send a message to the copilot. Creates a new session if session_id is
    omitted, otherwise continues an existing one owned by the caller.
    """
    if payload.session_id is not None:
        session = _get_owned_session(db, payload.session_id, current_user)
    else:
        session = ChatSession(
            user_id=current_user.id, title=_make_title(payload.message)
        )
        db.add(session)
        db.flush()  # assigns session.id without committing yet

    # Load prior turns for this session (server-side history only — never
    # trust history from the client).
    prior_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in prior_messages]

    if CHAT_DAILY_LIMIT > 0:
        today = datetime.now(timezone.utc).date()

        messages_today = (
            db.query(func.count(ChatMessage.id))
            .join(ChatSession, ChatMessage.session_id == ChatSession.id)
            .filter(
                ChatSession.user_id == current_user.id,
                ChatMessage.role == "user",
                func.date(ChatMessage.created_at) == today,
            )
            .scalar()
        ) or 0

        if messages_today >= CHAT_DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Daily demo limit reached. Please try again tomorrow.",
            )

    # Persist the user's message before calling the agent so it isn't lost
    # if the agent call fails partway through.
    user_msg = ChatMessage(session_id=session.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    try:
        # answer = "test message"
        answer = await run_agent(
            message=payload.message,
            history=history,
            db=db,
            current_user=current_user,
        )
    except Exception:
        logger.exception("Agent run failed for session %s", session.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant couldn't process that request. Please try again.",
        )

    assistant_msg = ChatMessage(session_id=session.id, role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    db.refresh(session)

    return ChatResponse(
        session_id=session.id,
        message=assistant_msg.content,
        created_at=assistant_msg.created_at,
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatSessionListResponse:
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return ChatSessionListResponse(
        sessions=[ChatSessionOut.model_validate(s) for s in sessions]
    )


@router.get("/sessions/{session_id}", response_model=ChatHistoryResponse)
def get_session_history(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatHistoryResponse:
    session = _get_owned_session(db, session_id, current_user)
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return ChatHistoryResponse(
        session=ChatSessionOut.model_validate(session),
        messages=[ChatMessageOut.model_validate(m) for m in messages],
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    session = _get_owned_session(db, session_id, current_user)
    db.delete(session)  # cascades to ChatMessage rows
    db.commit()
