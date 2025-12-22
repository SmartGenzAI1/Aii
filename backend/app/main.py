# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import chat, status, health, admin, web_search
from app.core.lifespan import lifespan
from app.middleware.request_id import RequestIDMiddleware
from app.core.exceptions import global_exception_handler

app = FastAPI(
    title="GenZ AI Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (V1 ONLY)
app.include_router(chat.router, prefix="/api/v1")
app.include_router(status.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(web_search.router, prefix="/api/v1")

# Global exception handler
app.add_exception_handler(Exception, global_exception_handler)

@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok", "service": "GenZ AI Backend"}
