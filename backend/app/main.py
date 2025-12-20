# backend/app/main.py

from fastapi import FastAPI
from sqlalchemy.exc import OperationalError
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="GenZ AI Backend")

@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database connected and tables ready")
    except OperationalError as e:
        print("Database not ready yet:", e)
