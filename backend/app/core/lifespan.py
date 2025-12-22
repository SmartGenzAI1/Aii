# backend/app/core/lifespan.py

from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic (DB checks, migrations, etc.)
    yield
    # Shutdown logic
