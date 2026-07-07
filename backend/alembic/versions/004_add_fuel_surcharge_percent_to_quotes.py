"""add fuel_surcharge_percent to quotes table

Revision ID: 004
Revises: 003
Create Date: 2026-07-07
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "quotes",
        sa.Column(
            "fuel_surcharge_percent",
            sa.Numeric(5, 2),
            nullable=False,
            server_default="8.00",
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "quotes",
        "fuel_surcharge_percent"
    )