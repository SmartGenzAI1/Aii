---

# 🚀 GenZ AI — Backend Platform

 ---    

GenZ AI Backend is a high-performance, multi-provider AI orchestration platform built with FastAPI, designed for scalability, fault tolerance, and production security.


---

✨ Key Capabilities

🔁 Multi-Provider Routing

Groq (multiple keys, rate-aware)

OpenRouter

HuggingFace

Web Search (scraping + API fallback)


🧠 Smart Provider Fallback

Per-provider rate limits

Automatic failover

Health-based routing


📊 Live Status System

Provider uptime

Health states (Up / Degraded / Down)

Frontend-ready status bars


🔐 Enterprise Security

JWT authentication

API key isolation

Environment validation

Request tracing (X-Request-ID)


⚡ Production-Grade Performance

Async I/O

Background health monitoring

SQLAlchemy 2.0 ORM

PostgreSQL (Supabase / Neon)




---

🧱 System Architecture

flowchart LR
    Client -->|HTTP| FastAPI
    FastAPI --> Router
    Router --> RateLimiter
    RateLimiter --> ProviderRouter
    ProviderRouter -->|Primary| Groq
    ProviderRouter -->|Fallback| OpenRouter
    ProviderRouter -->|Fallback| HuggingFace
    ProviderRouter -->|Search| WebScraper
    ProviderRouter --> PostgreSQL


---

📂 Backend Directory Structure

backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── chat.py
│   │       ├── status.py
│   │       ├── health.py
│   │       └── admin.py
│   ├── core/
│   │   ├── config.py
│   │   ├── lifespan.py
│   │   ├── rate_limit.py
│   │   └── exceptions.py
│   ├── db/
│   │   ├── session.py
│   │   └── base.py
│   ├── models/
│   │   ├── user.py
│   │   └── provider_status.py
│   ├── services/
│   │   ├── provider_router.py
│   │   ├── provider_monitor.py
│   │   └── providers/
│   │       ├── groq.py
│   │       ├── openrouter.py
│   │       ├── huggingface.py
│   │       └── base.py
│   ├── middleware/
│   │   └── request_id.py
│   └── main.py
└── requirements.txt


---

🔁 Provider Routing Logic

sequenceDiagram
    Client->>FastAPI: Chat Request
    FastAPI->>RateLimiter: Validate quota
    RateLimiter->>ProviderRouter: Route request
    ProviderRouter->>Groq: Try primary
    Groq-->>ProviderRouter: Fail / Limit
    ProviderRouter->>OpenRouter: Fallback
    OpenRouter-->>ProviderRouter: Success
    ProviderRouter-->>Client: Response


---

🔐 Security Model

Layer	Protection

API	JWT Authentication
Providers	Isolated API keys
Requests	Rate limiting
Startup	Env validation
Errors	Global handler
Logs	Request ID tracing


JWT Secret

Must be random, 256-bit minimum

Never hard-coded

Loaded via environment variables



---

⚙️ Configuration (Environment Variables)

DATABASE_URL=postgresql+psycopg://...
JWT_SECRET=super-strong-secret
GROQ_API_KEYS=key1,key2,key3
OPENROUTER_API_KEYS=key1,key2
HUGGINGFACE_API_KEY=key


---

🚦 Status & Health System

/api/v1/status → Provider status

/api/v1/health → Backend health

Background task checks providers every 60s

Frontend renders green / orange / red bars



---

🚀 Deployment

Render

Python 3.11+

Start command:


uvicorn app.main:app --host 0.0.0.0 --port 10000

Vercel (API)

Backend deployed separately

Frontend consumes REST API



---

🧪 Observability

Request ID injected into every response

Centralized error logging

Safe startup failure if DB is unreachable



---

📈 Production Readiness Checklist

[x] Async FastAPI

[x] PostgreSQL

[x] Rate limiting

[x] Provider failover

[x] Health monitoring

[x] Secure configuration

[x] Clean architecture

[x] Zero duplicated logic



---

📜 License

MIT License © 2025 — GenZ AI


---

✅ 
