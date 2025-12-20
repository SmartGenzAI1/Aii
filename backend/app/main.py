# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.health import router as health_router

# Setup logging immediately (before app creation)
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
)

# CORS — frontend will be on Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(
    health_router,
    prefix="/api/v1",
)

@app.get("/")
async def root():
    """
    Root endpoint.
    Cheap response for cold-start wakeup.
    """
    return {"message": "Backend running"}
