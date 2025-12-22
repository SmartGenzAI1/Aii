# backend/app/services/provider_monitor.py

import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import SessionLocal
from app.models.provider_status import ProviderStatus

logger = logging.getLogger(__name__)

CHECK_INTERVAL = 60  # seconds

async def check_providers_loop(providers: dict):
    while True:
        db: Session | None = None
        try:
            db = SessionLocal()

            for name, provider in providers.items():
                status = "down"
                try:
                    await provider.health_check()
                    status = "up"
                except Exception as e:
                    logger.warning(f"Provider {name} degraded: {e}")
                    status = "degraded"

                record = (
                    db.query(ProviderStatus)
                    .filter(ProviderStatus.provider == name)
                    .first()
                )

                if not record:
                    record = ProviderStatus(provider=name)

                record.status = status
                record.last_checked = datetime.utcnow()
                db.add(record)

            db.commit()

        except SQLAlchemyError as e:
            logger.error(f"Provider monitor DB error: {e}")

        finally:
            if db:
                db.close()

        await asyncio.sleep(CHECK_INTERVAL)
