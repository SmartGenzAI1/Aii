# backend/app/db/models.py

from datetime import datetime, date

from sqlalchemy import String, Integer, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """
    Application user.

    ID comes from Auth.js (JWT `sub` claim).
    We do NOT manage passwords here.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)

    role: Mapped[str] = mapped_column(String, default="user")

    daily_quota: Mapped[int] = mapped_column(Integer, default=100)
    daily_used: Mapped[int] = mapped_column(Integer, default=0)
    last_reset: Mapped[date] = mapped_column(Date, default=date.today)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
