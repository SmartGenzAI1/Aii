# backend/app/services/provider_monitor.py
"""
Background task to monitor provider health.
Runs every 60 seconds to check provider availability.
"""

import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker
from app.models.provider_status import ProviderStatus
from services.adapters.groq import GroqProvider
from services.adapters.openrouter import OpenRouterProvider
from services.adapters.huggingface import HuggingFaceProvider
import logging

logger = logging.getLogger(__name__)

CHECK_INTERVAL = 60  # seconds


def get_providers():
    """
    Get provider instances for health checking.
    """
    return {
        "groq": GroqProvider(),
        "openrouter": OpenRouterProvider(),
        "huggingface": HuggingFaceProvider(),
    }


async def check_providers_loop():
    """
    Background task loop that checks provider health every 60 seconds.
    Updates database with status.
    """
    logger.info("🔍 Provider monitor starting")

    while True:
        try:
            # Create async session
            async with async_session_maker() as db:
                try:
                    providers = get_providers()

                    for name, provider in providers.items():
                        status = "down"
                        error_msg = None

                        try:
                            # Check provider health
                            await provider.health_check()
                            status = "up"
                            logger.debug(f"✅ {name} is healthy")

                        except Exception as e:
                            status = "down"
                            error_msg = str(e)[:100]  # Truncate error message
                            logger.warning(f"⚠️ {name} health check failed: {e}")

                        # Look up or create provider status record
                        from sqlalchemy import select

                        stmt = select(ProviderStatus).where(
                            ProviderStatus.provider == name
                        )
                        result = await db.execute(stmt)
                        record = result.scalar_one_or_none()

                        if not record:
                            # Create new record
                            record = ProviderStatus(
                                provider=name,
                                status=status,
                                uptime=100.0 if status == "up" else 0.0,
                                last_checked=datetime.utcnow(),
                            )
                            logger.info(f"📝 Created status record for {name}")
                        else:
                            # Update existing record
                            record.status = status
                            record.last_checked = datetime.utcnow()

                            # Update uptime percentage
                            if status == "up":
                                record.uptime = min(record.uptime + 1, 100.0)
                            else:
                                record.uptime = max(record.uptime - 2, 0.0)

                        db.add(record)

                    # Commit all changes
                    await db.commit()
                    logger.debug("✅ Provider status updated in database")

                except Exception as e:
                    await db.rollback()
                    logger.error(f"❌ Error updating provider status: {e}", exc_info=True)

        except Exception as e:
            logger.error(f"❌ Provider monitor loop error: {e}", exc_info=True)

        # Wait before next check
        await asyncio.sleep(CHECK_INTERVAL)


def start_provider_monitor():
    """
    Start the background provider monitoring task.
    Called once during app startup in lifespan.
    """
    task = asyncio.create_task(check_providers_loop())
    logger.info("🚀 Provider monitor task created")
