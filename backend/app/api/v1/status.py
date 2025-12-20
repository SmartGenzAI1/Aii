# backend/app/api/v1/status.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.provider_status import ProviderStatus

router = APIRouter(prefix="/status", tags=["Status"])

@router.get("")
def get_status(db: Session = Depends(get_db)):
    providers = db.query(ProviderStatus).all()
    return [
        {
            "provider": p.provider,
            "status": p.status,
            "uptime": round(p.uptime, 2),
            "last_checked": p.last_checked
        }
        for p in providers
    ]
