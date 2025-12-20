# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.base import Base

# API routers
from app.api.v1 import status
from app.api.v1 import web_search

app = FastAPI(
    title="AII Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# -------------------------
# CORS (frontend safe)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Startup: DB init
# -------------------------
@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database connected and tables ready")
    except Exception as e:
        print("Database not ready yet:", str(e))

# -------------------------
# Health check
# -------------------------
@app.get("/", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "aii-backend"
    }

# -------------------------
# API Routers
# -------------------------
app.include_router(status.router)
app.include_router(web_search.router)

# -------------------------
# Future routers (planned)
# -------------------------
# app.include_router(ai_router.router)
# app.include_router(auth.router)
# app.include_router(admin.router)
