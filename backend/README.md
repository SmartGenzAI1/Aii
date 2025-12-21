Aii Backend

    

Aii Backend is a production-ready FastAPI service that routes AI requests across multiple providers (Groq, OpenRouter, HuggingFace, Scraper/Web), applies rate-limits and fallback logic, and exposes a live provider health/status API.


Core Responsibilities

Intelligent provider routing & fallback

Per-provider rate-limit enforcement

Provider health tracking (green / orange / red)

Centralized API key management

Status API for frontend dashboards

PostgreSQL persistence (Supabase / Neon compatible)



---

High-Level Architecture (Mermaid)

> This diagram is auto-rendered by GitHub using Mermaid.



flowchart TD
    Client[Frontend / API Client]
    API[FastAPI Backend]
    Router[Provider Router]
    RateLimiter[Rate Limiter]
    Groq[Groq Adapters x3]
    OpenRouter[OpenRouter Adapters x2]
    HF[HuggingFace Adapter]
    Scraper[Web Scraper]
    DB[(PostgreSQL)]
    StatusAPI[/Status API/]

    Client --> API
    API --> Router
    Router --> RateLimiter

    RateLimiter -->|Available| Groq
    RateLimiter -->|Fallback| OpenRouter
    RateLimiter -->|Fallback| HF
    RateLimiter -->|Fallback| Scraper

    Groq --> DB
    OpenRouter --> DB
    HF --> DB
    Scraper --> DB

    DB --> StatusAPI
    StatusAPI --> Client


---

Backend Structure

backend/
└── app/
    ├── main.py
    ├── api/
    │   └── v1/
    │       ├── provider.py
    │       ├── status.py
    │       └── health.py
    ├── services/
    │   ├── provider_router.py
    │   ├── rate_limiter.py
    │   └── status_tracker.py
    ├── adapters/
    │   ├── groq.py
    │   ├── openrouter.py
    │   ├── huggingface.py
    │   └── scraper.py
    ├── models/
    │   └── provider_status.py
    ├── db/
    │   ├── session.py
    │   └── base.py
    └── core/
        └── config.py


---

Provider Routing Logic

1. Incoming request hits /api/v1/provider


2. provider_router.py:

Checks provider availability

Ensures rate-limit safety (e.g. 49/50 RPM)

Selects best provider



3. If provider fails or is throttled:

Automatically falls back to next provider



4. Provider result + latency stored in DB


5. Provider status updated




---

Provider Status System

Each provider is tracked in the database:

Field	Description

provider	Provider name
status	green / orange / red
uptime	Rolling uptime percentage
last_checked	Last health update


Status API

GET /api/v1/status

Returns data consumed by the frontend status bar UI (Groq-style vertical bars).


---

Environment Variables

All secrets are backend-only.

DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db

GROQ_API_KEY_1=xxx
GROQ_API_KEY_2=xxx
GROQ_API_KEY_3=xxx

OPENROUTER_API_KEY_1=xxx
OPENROUTER_API_KEY_2=xxx

HUGGINGFACE_API_KEY=xxx

Never expose these to the frontend.


---

Running Locally

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Docs:

http://localhost:8000/docs


---

Deployment (Render)

Web Service

Python runtime

Start command:


uvicorn app.main:app --host 0.0.0.0 --port 10000

Add environment variables in Render dashboard

Database: Supabase or Neon



---

Production Guarantees

Graceful provider degradation

Zero frontend API key exposure

Automatic DB table creation

No hard provider dependency

Horizontal scaling safe



---

Roadmap (Backend)

Per-user rate limits

Circuit-breaker logic

Background health checks

Cost-aware routing

Redis cache (optional)



---

License

MIT — production and commercial use allowed.


---
