from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Numeric,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Home(Base):
    __tablename__ = "homes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    district: Mapped[str] = mapped_column(String(100))
    rooms: Mapped[int]
    area: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    price: Mapped[Decimal] = mapped_column(Numeric(15, 2))

    projects: Mapped[list["Project"]] = relationship(
        back_populates="home",
        passive_deletes="all",
    )

    __table_args__ = (
        CheckConstraint("rooms > 0", name="ck_home_rooms_positive"),
        CheckConstraint("area > 0", name="ck_home_area_positive"),
        CheckConstraint("price > 0", name="ck_home_price_positive"),
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)

    home_id: Mapped[int] = mapped_column(
        ForeignKey("homes.id", ondelete="RESTRICT"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100))
    budget: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        server_default="active",
    )

    home: Mapped["Home"] = relationship(
        back_populates="projects",
    )

    __table_args__ = (
        CheckConstraint(
            "budget > 0",
            name="ck_project_budget_positive",
        ),
        CheckConstraint(
            "status IN ('active', 'completed')",
            name="ck_project_status",
        ),
        Index(
            "uq_active_project_per_home",
            "home_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )