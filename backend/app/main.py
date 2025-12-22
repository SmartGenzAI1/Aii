# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.lifespan import lifespan
from app.api.v1 import chat, status, health, admin, web_search

app = FastAPI(
    title="AI Platform",
    lifespan=lifespan,
)

# 🚨 REQUIRED FOR BROWSER CLIENTS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for now; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(chat.router, prefix="/api/v1")
app.include_router(status.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(web_search.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"status": "ok"}
