"""add core tables: equipment_types, accessorials, lanes, quotes

Revision ID: 002
Revises: c56e7a5bb2bf
Create Date: 2026-06-29
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = 'c56e7a5bb2bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'equipment_types',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('multiplier', sa.Numeric(5, 2), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'accessorials',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('charge_type', sa.String(10), nullable=False),  # 'flat' or 'percent'
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'lanes',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('origin_city', sa.String(100), nullable=False),
        sa.Column('origin_province', sa.String(10), nullable=False),
        sa.Column('destination_city', sa.String(100), nullable=False),
        sa.Column('destination_province', sa.String(10), nullable=False),
        sa.Column('base_rate', sa.Numeric(10, 2), nullable=False),
        sa.Column('distance_km', sa.Integer(), nullable=False),
        sa.Column('transit_days', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'quotes',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('customer_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('lane_id', sa.UUID(), sa.ForeignKey('lanes.id'), nullable=False),
        sa.Column('equipment_type_id', sa.UUID(), sa.ForeignKey('equipment_types.id'), nullable=False),
        sa.Column('total_weight', sa.Numeric(10, 2), nullable=False),
        sa.Column('pickup_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('base_rate', sa.Numeric(10, 2), nullable=False),
        sa.Column('equipment_adjustment', sa.Numeric(10, 2), nullable=False),
        sa.Column('weight_adjustment', sa.Numeric(10, 2), nullable=False),
        sa.Column('fuel_surcharge', sa.Numeric(10, 2), nullable=False),
        sa.Column('accessorials_total', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('breakdown_json', sa.Text(), nullable=True),  # stores full breakdown as JSON
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Junction table: which accessorials were applied to a quote
    op.create_table(
        'quote_accessorials',
        sa.Column('quote_id', sa.UUID(), sa.ForeignKey('quotes.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('accessorial_id', sa.UUID(), sa.ForeignKey('accessorials.id'), primary_key=True),
        sa.Column('fee_applied', sa.Numeric(10, 2), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('quote_accessorials')
    op.drop_table('quotes')
    op.drop_table('lanes')
    op.drop_table('accessorials')
    op.drop_table('equipment_types')