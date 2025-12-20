# backend/app/api/status_history.py
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.status import SystemStatus

router = APIRouter(prefix="/status")

@router.get("/history/{service}")
def get_status_history(service: str, limit: int = 90):
    db: Session = SessionLocal()
    records = (
        db.query(SystemStatus)
        .filter(SystemStatus.service == service)
        .order_by(SystemStatus.created_at.desc())
        .limit(limit)
        .all()
    )
    db.close()

    return [
        {
            "status": r.status,
            "date": r.created_at.date().isoformat()
        }
        for r in records
    ]
