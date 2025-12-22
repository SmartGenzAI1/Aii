GenZ AI  Backend Service

      



Overview

GenZ AI Backend is a production-ready, multi-provider AI orchestration service built with FastAPI.
It intelligently routes requests across multiple AI providers (Groq, OpenRouter, HuggingFace, Web Search) while enforcing rate limits, uptime monitoring, fallback routing, and security controls.

The backend is designed to be:

Horizontally scalable

Provider-agnostic

Fault tolerant

Deployment-ready on Render, Vercel, or containers



---

Key Capabilities

Core AI Platform

Multi-provider LLM routing

Automatic provider fallback

Centralized provider usage tracking

Adaptive rate limiting per provider


Reliability & Status

Provider health monitoring

Uptime percentage tracking

System-level operational status

Frontend-ready status API (Groq-style bars)


Security

JWT authentication

Role-based access control (user/admin)

Environment-based secret management

SQL injection & request validation protection


Developer Experience

OpenAPI documentation (/docs)

Versioned APIs (/api/v1)

Modular architecture

Clear separation of concerns



---

Architecture Overview

flowchart TB
    Client -->|HTTPS| FastAPI
    FastAPI --> APIv1[API v1 Router]

    APIv1 --> ProviderRouter
    ProviderRouter -->|Primary| Groq
    ProviderRouter -->|Fallback| OpenRouter
    ProviderRouter -->|Fallback| HuggingFace
    ProviderRouter -->|Search| WebScraper

    ProviderRouter --> UsageTracker
    ProviderRouter --> CircuitBreaker

    ProviderMonitor --> ProviderStatusDB[(Postgres)]
    APIv1 --> ProviderStatusDB


---

Tech Stack

Layer	Technology

Language	Python 3.11+
Framework	FastAPI
Database	PostgreSQL (Supabase)
ORM	SQLAlchemy 2.x
Auth	JWT
Server	Uvicorn
Hosting	Render
Docs	OpenAPI / Swagger



---

Project Structure

backend/app
├── main.py                 # App entrypoint
├── api/
│   └── v1/
│       ├── chat.py         # AI chat endpoint
│       ├── status.py       # Provider & system status
│       ├── system.py       # System health
│       ├── web_search.py   # Web search endpoint
│       ├── admin.py        # Admin-only APIs
│       └── auth.py         # Authentication
│
├── services/
│   ├── provider_router.py  # Core AI routing logic
│   ├── usage_tracker.py    # Rate & quota enforcement
│   ├── system_health.py   # Aggregated system health
│   └── web_scraper.py     # Search scraping
│
├── adapters/
│   ├── groq.py
│   ├── openrouter.py
│   ├── huggingface.py
│   └── base.py
│
├── workers/
│   └── provider_monitor.py # Background health checks
│
├── models/
│   ├── user.py
│   ├── provider_status.py
│   ├── provider_usage.py
│   └── audit_log.py
│
├── core/
│   ├── config.py           # Env configuration
│   ├── security.py         # JWT & hashing
│   ├── rate_limit.py       # User rate limiting
│   ├── circuit_breaker.py  # Provider failover
│   └── logging.py          # Structured logs
│
├── db/
│   ├── session.py
│   └── base.py


---

Environment Variables

DATABASE_URL=postgresql+psycopg://user:password@host:5432/db
JWT_SECRET=your-strong-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

GROQ_API_KEY=xxx
OPENROUTER_API_KEY=xxx
HUGGINGFACE_API_KEY=xxx

> Important: Never commit .env files to version control.




---

API Documentation

Once running, access:

Swagger UI:
https://<your-domain>/docs

OpenAPI JSON:
https://<your-domain>/openapi.json



---

Status System Design

The backend exposes machine-readable status data only.

Status Endpoint

GET /api/v1/status

Returns:

Provider name

Status (up, degraded, down)

Uptime percentage

Last checked timestamp


The frontend is responsible for:

Vertical bar visualization

Green / orange / red indicators

Human-readable banners


This clean separation ensures scalability and flexibility.


---

Security Model

JWT authentication on protected routes

Password hashing with bcrypt

SQLAlchemy ORM prevents SQL injection

Provider secrets isolated from client

Admin routes restricted by role



---

Deployment Notes

Render

Set environment variables in dashboard

Expose port 10000

Start command:


uvicorn app.main:app --host 0.0.0.0 --port 10000

Health Checks

GET /
GET /health


---

Production Readiness Checklist

Versioned APIs

DB migrations supported

Provider isolation

Rate limiting enforced

Observability hooks present

Zero hardcoded secrets



---

License

MIT License © GenZ AI


---

Maintainers

Built and maintained by GenZ AI Team
Designed for scale, reliability, and extensibility.


