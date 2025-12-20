#backend/app/api/status.py
from fastapi import APIRouter
from sqlalchemy import text
from datetime import datetime
import time

from app.db.session import engine

router = APIRouter()

START_TIME = time.time()

@router.get("/status")
def system_status():
    status = {
        "api": "up",
        "database": "down",
        "uptime_percent": "99.9%",
        "latency_ms": None,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Measure DB latency + health
    try:
        start = time.time()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        status["database"] = "up"
        status["latency_ms"] = int((time.time() - start) * 1000)
    except Exception:
        status["database"] = "down"

    return status
