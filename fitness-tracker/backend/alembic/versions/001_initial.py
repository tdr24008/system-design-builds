"""Initial schema with partitioned workout_samples

Revision ID: 001
Revises:
Create Date: 2026-05-18
"""
from datetime import date, timedelta

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def _next_month_first(d: date) -> date:
    if d.month == 12:
        return date(d.year + 1, 1, 1)
    return date(d.year, d.month + 1, 1)


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("handle", sa.String(), unique=True, nullable=False),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("avatar_hue", sa.Integer(), server_default="240"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── follows ─────────────────────────────────────────────────────────
    op.create_table(
        "follows",
        sa.Column("follower_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("followee_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_follows_followee", "follows", ["followee_id"])

    # ── workouts ────────────────────────────────────────────────────────
    op.create_table(
        "workouts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False, server_default="Workout"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("distance_km", sa.Double(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("privacy", sa.String(), nullable=False, server_default="followers"),
        sa.Column("client_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("server_updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("deleted", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_workouts_user_server_ts", "workouts", ["user_id", "server_updated_at"])
    op.create_index("ix_workouts_user_started", "workouts", ["user_id", "started_at"])

    # ── workout_samples (partitioned by ts, monthly) ────────────────────
    op.execute("""
        CREATE TABLE workout_samples (
            workout_id  UUID        NOT NULL,
            ts          TIMESTAMPTZ NOT NULL,
            metric      TEXT        NOT NULL,
            value       DOUBLE PRECISION NOT NULL
        ) PARTITION BY RANGE (ts)
    """)

    # Create current month + next month partitions
    today = date.today()
    cur_start = date(today.year, today.month, 1)
    nxt_start = _next_month_first(cur_start)
    nxt_nxt_start = _next_month_first(nxt_start)

    op.execute(f"""
        CREATE TABLE workout_samples_{cur_start.strftime('%Y_%m')}
        PARTITION OF workout_samples
        FOR VALUES FROM ('{cur_start}') TO ('{nxt_start}')
    """)
    op.execute(f"""
        CREATE TABLE workout_samples_{nxt_start.strftime('%Y_%m')}
        PARTITION OF workout_samples
        FOR VALUES FROM ('{nxt_start}') TO ('{nxt_nxt_start}')
    """)

    op.execute("""
        CREATE INDEX ix_workout_samples_workout
        ON workout_samples (workout_id, ts)
    """)

    # ── goals ───────────────────────────────────────────────────────────
    op.create_table(
        "goals",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("metric", sa.String(), nullable=False),
        sa.Column("target", sa.Double(), nullable=False),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── personal_records ────────────────────────────────────────────────
    op.create_table(
        "personal_records",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("value", sa.String(), nullable=False),
        sa.Column("icon", sa.String(), nullable=False),
        sa.Column("date_achieved", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS workout_samples CASCADE")
    op.drop_table("personal_records")
    op.drop_table("goals")
    op.drop_table("workouts")
    op.drop_table("follows")
    op.drop_table("users")
