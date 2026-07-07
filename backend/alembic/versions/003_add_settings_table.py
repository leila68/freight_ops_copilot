"""add settings table

Revision ID: 003
Revises: 002
Create Date: 2026-06-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'settings',
        sa.Column('key', sa.String(100), primary_key=True),
        sa.Column('value', sa.String(255), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()')),
    )

    # Seed default fuel surcharge
    op.execute("""
        INSERT INTO settings (key, value, description)
        VALUES ('fuel_surcharge_percent', '8.00',
                'Fuel surcharge applied to base rate as a percentage')
    """)


def downgrade() -> None:
    op.drop_table('settings')