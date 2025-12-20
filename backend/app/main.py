# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.health import router as health_router
from app.api.v1.chat import router as chat_router
from app.db.models import Base
from app.db.session import engine
app = FastAPI(title="GenZ AI")

@app.on_event("startup")
def on_startup():
    # Auto-create tables
    Base.metadata.create_all(bind=engine)
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"status": "running"}
