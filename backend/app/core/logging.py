# backend/app/core/logging.py

import logging


def setup_logging():
    """
    Simple, fast logging.
    Avoid heavy logging frameworks for cold-start speed.
    Render captures stdout/stderr automatically.
    """

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
