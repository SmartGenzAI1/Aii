# backend/app/services/provider_monitor.py

import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.provider_status import ProviderStatus
from app.services.providers.base import BaseProvider
from app.services.providers.groq import GroqProvider
from app.services.providers.openrouter import OpenRouterProvider
from app.services.providers.huggingface import HuggingFaceProvider

PROVIDERS = {
    "groq": GroqProvider(),
    "openrouter": OpenRouterProvider(),
    "huggingface": HuggingFaceProvider(),
}

CHECK_INTERVAL = 60  # seconds

async def check_providers():
    while True:
        db: Session = SessionLocal()
        try:
            for name, provider in PROVIDERS.items():
                status = "down"
                try:
                    await provider.health_check()
                    status = "up"
                except Exception:
                    status = "degraded"

                record = db.query(ProviderStatus).filter_by(provider=name).first()
                if not record:
                    record = ProviderStatus(provider=name)

                record.status = status
                record.last_checked = datetime.utcnow()
                db.add(record)

            db.commit()
        finally:
            db.close()

        await asyncio.sleep(CHECK_INTERVAL)

def start_provider_monitor():
    return asyncio.create_task(check_providers())
