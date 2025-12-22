# backend/app/services/provider_monitor.py

import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.provider_status import ProviderStatus


CHECK_INTERVAL = 60  # seconds


async def check_providers_loop():
    """
    Background task that updates provider health.
    """
    while True:
        db: Session = SessionLocal()
        try:
            # Providers are optional; keep DB stable even if none configured
            records = db.query(ProviderStatus).all()

            for record in records:
                record.last_checked = datetime.utcnow()
                record.status = "unknown"
                db.add(record)

            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

        await asyncio.sleep(CHECK_INTERVAL)


def start_provider_monitor():
    """
    Entry point expected by lifespan.py
    """
    asyncio.create_task(check_providers_loop())
