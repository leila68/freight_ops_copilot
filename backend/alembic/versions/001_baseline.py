"""baseline - users table already created manually

Revision ID: c56e7a5bb2bf
Revises: 
Create Date: 2026-06-01
"""
from typing import Sequence, Union

revision: str = 'c56e7a5bb2bf'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users table was created manually via backend/db/init/001_init.sql
    pass


def downgrade() -> None:
    pass