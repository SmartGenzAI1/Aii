# backend/app/services/provider_monitor.py

import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.provider_status import ProviderStatus
from app.services.adapters.groq import GroqProvider
from app.services.adapters.openrouter import OpenRouterProvider
from app.services.adapters.huggingface import HuggingFaceProvider


CHECK_INTERVAL = 60  # seconds


def get_providers():
    """
    Lazy provider initialization.
    Prevents import-time crashes.
    """
    return {
        "groq": GroqProvider(),
        "openrouter": OpenRouterProvider(),
        "huggingface": HuggingFaceProvider(),
    }


async def check_providers_loop():
    while True:
        db: Session = SessionLocal()
        try:
            providers = get_providers()

            for name, provider in providers.items():
                status = "down"

                try:
                    await provider.health_check()
                    status = "up"
                except Exception:
                    status = "down"

                record = (
                    db.query(ProviderStatus)
                    .filter_by(provider=name)
                    .first()
                )

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
    """
    Called once during app startup.
    """
    asyncio.create_task(check_providers_loop())
