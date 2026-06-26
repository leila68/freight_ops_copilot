"""
FastAPI application entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User  # noqa: F401  (imported so SQLAlchemy registers the model)
from app.api.auth import router as auth_router

app = FastAPI(title="Freight Ops Copilot API")

app.include_router(auth_router)


@app.get("/health")
def health_check():
    """Basic liveness check — does not touch the database."""
    return {"status": "ok"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Confirms the API can actually reach Postgres and query the users table."""
    db.execute(text("SELECT 1"))
    user_count = db.query(User).count()
    return {"status": "ok", "database": "connected", "user_count": user_count}