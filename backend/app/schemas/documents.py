"""Pydantic schemas for document management."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    title: str
    filename: str
    file_size: int
    chunk_count: int
    uploaded_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    content: str

    class Config:
        from_attributes = True