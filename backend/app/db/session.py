"""
SQLAlchemy engine and session management.

`get_db` is a FastAPI dependency: each request gets its own DB session,
which is closed automatically once the request finishes.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class all ORM models inherit from."""
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()