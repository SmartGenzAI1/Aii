# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
import time

from app.db.session import engine
from app.db.base import Base
from app.services.health_checker import record_health
from app.api.status_history import router as status_router

# ------------------------------------------------------------------
# App init
# ------------------------------------------------------------------

app = FastAPI(
    title="GenZ AI API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ------------------------------------------------------------------
# CORS (adjust origins later when frontend is ready)
# ------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Database init
# ------------------------------------------------------------------

@app.on_event("startup")
def startup_db():
    Base.metadata.create_all(bind=engine)
    print("Database connected and tables ready")

# ------------------------------------------------------------------
# Health monitoring loop (5-minute interval)
# ------------------------------------------------------------------

def health_loop():
    while True:
        try:
            record_health()
        except Exception as e:
            print("Health check failed:", e)
        time.sleep(300)  # 5 minutes

@app.on_event("startup")
def start_health_monitor():
    thread = threading.Thread(target=health_loop, daemon=True)
    thread.start()

# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------

app.include_router(status_router, tags=["Status"])

# ------------------------------------------------------------------
# Root (optional)
# ------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "GenZ AI",
        "status": "running",
        "docs": "/docs"
    }
