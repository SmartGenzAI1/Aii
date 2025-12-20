# backend/app/main.py

from fastapi import FastAPI
from app.db.models import Base
from app.db.session import engine

app = FastAPI(title="GenZ AI")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
