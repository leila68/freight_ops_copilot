"""add documents and document_chunks tables

Revision ID: 005
Revises: 004
Create Date: 2026-07-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Parent document — stores metadata and original file
    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False, server_default='application/pdf'),
        sa.Column('uploaded_by', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('chunk_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Chunks — each document split into semantic pieces with embeddings
    op.create_table(
        'document_chunks',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('document_id', sa.UUID(), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Index for fast similarity search
    op.execute("""
        CREATE INDEX document_chunks_embedding_idx
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 10)
    """)


def downgrade() -> None:
    op.drop_table('document_chunks')
    op.drop_table('documents')