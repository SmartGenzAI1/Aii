# backend/app/main.py

from fastapi import FastAPI
from app.api.chat import router as chat_router
from app.api.status import router as status_router
from app.db.session import init_db

app = FastAPI(
    title="GenZ AI Backend",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {"service": "GenZ AI", "status": "running"}

app.include_router(chat_router, prefix="/api")
app.include_router(status_router, prefix="/api")
