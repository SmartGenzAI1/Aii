# backend/app/db/session.py

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

def init_db():
    Base.metadata.create_all(bind=engine)
