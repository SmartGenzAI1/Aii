# backend/app/services/provider_monitor.py

import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.provider_status import ProviderStatus

from app.services.adapters.groq import generate as groq_generate
from app.services.adapters.openrouter import generate as openrouter_generate
from app.services.adapters.huggingface import generate as huggingface_generate

CHECK_INTERVAL = 60  # seconds


async def check_providers_loop():
    while True:
        db: Session = SessionLocal()
        try:
            providers = {
                "groq": groq_generate,
                "openrouter": openrouter_generate,
                "huggingface": huggingface_generate,
            }

            for name in providers.keys():
                status = "up"

                try:
                    # lightweight no-op check
                    # do NOT burn tokens
                    pass
                except Exception:
                    status = "degraded"

                record = (
                    db.query(ProviderStatus)
                    .filter(ProviderStatus.provider == name)
                    .first()
                )

                if not record:
                    record = ProviderStatus(
                        provider=name,
                        status=status,
                        last_checked=datetime.utcnow(),
                    )
                else:
                    record.status = status
                    record.last_checked = datetime.utcnow()

                db.add(record)

            db.commit()

        except Exception as e:
            db.rollback()
            print(f"[provider_monitor] error: {e}")

        finally:
            db.close()

        await asyncio.sleep(CHECK_INTERVAL)


def start_provider_monitor():
    return asyncio.create_task(check_providers_loop())
