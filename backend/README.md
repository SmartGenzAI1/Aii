# 🚀 GenZ AI Backend - Enterprise Production Guide

> **High-scale FastAPI backend supporting 100,000+ users and 50,000+ concurrent connections with multi-provider AI routing, JWT authentication, and comprehensive monitoring.**

---

## 📋 Quick Reference

| Component | Tech | Status |
|-----------|------|--------|
| **Framework** | FastAPI + Uvicorn | ✅ Production |
| **Database** | PostgreSQL 14+ (Async) | ✅ Connected |
| **Authentication** | JWT (HS256) | ✅ Implemented |
| **Providers** | Groq, OpenRouter, HF | ✅ Configured |
| **Deployment** | Render | ✅ Live |
| **Monitoring** | Provider health checks | ✅ Running |

---

## 🎯 Scaling Targets

**Production Requirements:**
- **Users**: 100,000+ registered users
- **Concurrency**: 50,000+ simultaneous connections
- **Latency**: <500ms P95 response time
- **Availability**: 99.9% uptime
- **Throughput**: 10,000+ requests/minute

**Architecture Decisions:**
- **Stateless**: All instances identical, no shared state
- **Async**: Full async/await patterns, non-blocking I/O
- **Horizontal**: Scales via instance count, not size
- **Resilient**: Circuit breakers, retries, graceful degradation

---

## 🏗️ Architecture

### Request Flow Diagram

```
Browser Request
    ↓
[HTTPS]
    ↓
┌─────────────────────────────────────────┐
│ FastAPI Server (Port 10000)             │
├─────────────────────────────────────────┤
│ 1. RequestID Middleware (tracing)      │
│ 2. SecurityHeaders Middleware           │
│ 3. RequestValidation Middleware         │
│ 4. TrustedHost Middleware               │
│ 5. CORS Middleware                      │
├─────────────────────────────────────────┤
│ Authentication: verify_jwt()            │
│ ↓                                       │
│ Rate Limiting: check_quota()            │
│ ↓                                       │
│ Request Handler: /api/v1/chat           │
├─────────────────────────────────────────┤
│ Service Layer:                          │
│ • AIRouter.stream()                     │
│ • ProviderMonitor.check_health()        │
│ • WebSearch.scrape()                    │
├─────────────────────────────────────────┤
│ External APIs:                          │
│ • Groq (llama-3.1-8b/70b)              │
│ • OpenRouter (GPT-4o-mini)             │
│ • HuggingFace (inference endpoint)     │
├─────────────────────────────────────────┤
│ PostgreSQL Database:                    │
│ • users (id, email, quota, is_admin)   │
│ • provider_status (uptime tracking)    │
└─────────────────────────────────────────┘
    ↓
[Streaming Response: Server-Sent Events]
    ↓
Browser (displays tokens as they arrive)
```

---

## 🚀 Getting Started

### 1. Local Development (5 minutes)

```bash
# Clone and setup
git clone https://github.com/yourusername/genzai.git
cd genzai/backend

# Virtual environment
python -m venv venv
source venv/bin/activate

# Dependencies
pip install -r requirements.txt

# Environment setup
cp .env.example .env

# Edit .env - set these as minimum:
# DATABASE_URL=postgresql+asyncpg://localhost/genzai_dev
# JWT_SECRET=your-super-secret-key-min-32-chars
# GROQ_API_KEYS=your_groq_key
# OPENROUTER_API_KEYS=your_openrouter_key

# Run server
uvicorn main:app --reload --port 8000

# Or use CLI
python -m backend.cli.main serve --reload --port 8000

# Test with CLI
python -m backend.cli.main health

# Or test with curl
curl http://localhost:8000/health
```

### 2. Database Setup

```bash
# Using Supabase (recommended for production)
1. Create account at https://supabase.com
2. Create new project
3. Copy connection string → DATABASE_URL in .env
4. Tables auto-create on first run

# Using local PostgreSQL
1. Install PostgreSQL 14+
2. Create database: createdb genzai_dev
3. Set DATABASE_URL=postgresql://user:pass@localhost/genzai_dev
```

### 3. GenZ AI CLI Setup

The GenZ AI CLI provides professional command-line management:

```bash
# Install CLI dependencies (included in requirements.txt)
pip install -r requirements.txt

# Show available commands
python -m backend.cli.main --help

# Check backend health
python -m backend.cli.main health --detailed

# Check provider status
python -m backend.cli.main status

# Start server
python -m backend.cli.main serve --host 0.0.0.0 --port 8000

# Send chat message (requires token)
python -m backend.cli.main chat --token YOUR_JWT_TOKEN "Hello AI!"

# Config management
python -m backend.cli.main config get host
python -m backend.cli.main config set host http://localhost:8000
```

### 4. API Keys Setup

```bash
# Groq (fastest)
1. Go to https://console.groq.com/keys
2. Create API key
3. Add to .env: GROQ_API_KEYS=gsk_xxxxx

# OpenRouter (smartest)
1. Go to https://openrouter.ai/keys
2. Create API key
3. Add to .env: OPENROUTER_API_KEYS=sk-or-xxxxx

# HuggingFace (optional)
1. Go to https://huggingface.co/settings/tokens
2. Create token
3. Add to .env: HUGGINGFACE_API_KEY=hf_xxxxx
```

---

## 🖥️ GenZ AI CLI

Professional command-line interface for backend operations:

```bash
# Health monitoring
python -m backend.cli.main health --detailed
python -m backend.cli.main status

# Server management
python -m backend.cli.main serve --port 8000

# AI interactions (requires JWT token)
python -m backend.cli.main chat --token JWT_TOKEN "Hello AI!"

# Configuration
python -m backend.cli.main config get host
python -m backend.cli.main config set host http://localhost:8000
```

**Features:**
- ✅ Production-grade Python CLI built with Typer
- ✅ Full backend service integration
- ✅ Comprehensive error handling and logging
- ✅ Real-time health monitoring
- ✅ AI provider status checking
- ✅ Interactive AI chat with streaming support
- ✅ Configuration management

---

## 📡 API Endpoints Reference

### Authentication

#### Login (Get JWT Token)
```bash
POST /api/v1/auth/login

Body:
{
  "email": "user@example.com"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Chat

#### Send Message
```bash
POST /api/v1/chat
Header: Authorization: Bearer {token}

Body:
{
  "prompt": "What is AI?",
  "model": "fast",           # fast|balanced|smart
  "stream": true
}

Response (200):
Server-Sent Events stream
data: "This"
data: " is"
data: " artificial"
data: " intelligence"
```

#### Get User Quota
```bash
GET /api/v1/quota
Header: Authorization: Bearer {token}

Response (200):
{
  "used": 15,
  "limit": 50,
  "remaining": 35,
  "resets_at": "2025-12-26T00:00:00Z",
  "reset_time_utc": "00:00 UTC"
}
```

#### List Available Models
```bash
GET /api/v1/models
Header: Authorization: Bearer {token}

Response (200):
{
  "models": [
    {
      "id": "fast",
      "name": "Fast ⚡",
      "provider": "groq",
      "description": "Quick responses, good for simple queries",
      "available": true
    },
    {
      "id": "balanced",
      "name": "Balanced ⚖️",
      "provider": "openrouter",
      "description": "Balance of speed and quality",
      "available": true
    },
    {
      "id": "smart",
      "name": "Smart 🧠",
      "provider": "openrouter",
      "description": "Best quality, slower responses",
      "available": true
    }
  ]
}
```

### Status & Health

#### Provider Status
```bash
GET /api/v1/status

Response (200):
[
  {
    "provider": "groq",
    "status": "up",
    "uptime": 99.82,
    "last_checked": "2025-12-24T12:50:26Z"
  },
  {
    "provider": "openrouter",
    "status": "up",
    "uptime": 98.45,
    "last_checked": "2025-12-24T12:50:27Z"
  },
  {
    "provider": "huggingface",
    "status": "up",
    "uptime": 95.12,
    "last_checked": "2025-12-24T12:50:27Z"
  }
]
```

#### Backend Health
```bash
GET /health

Response (200):
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "GenZ AI Backend"
}
```

#### Readiness Check
```bash
GET /ready

Response (200):
{
  "ready": true,
  "environment": "production"
}
```

### Web Search

#### Search Web
```bash
GET /api/v1/web-search?q=machine+learning
Header: Authorization: Bearer {token}

Response (200):
{
  "status": "success",
  "source": "scrape",
  "query": "machine learning",
  "results": [
    {
      "title": "Machine Learning - Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Machine_learning"
    }
  ]
}
```

---

## 🔐 Security Details

### JWT Token Structure

```json
{
  "sub": "12345",                    // User ID
  "email": "user@example.com",       // Email
  "iat": 1703433026,                 // Issued at (now)
  "exp": 1703519426                  // Expires in 24 hours
}
```

### Middleware Security Stack

```
Request
   ↓
[1] RequestIDMiddleware    → Adds X-Request-ID header for tracing
   ↓
[2] SecurityHeadersMiddleware → Adds HSTS, X-Frame-Options, CSP
   ↓
[3] RequestValidationMiddleware → Checks Content-Type, size limits
   ↓
[4] TrustedHostMiddleware  → Whitelists allowed hosts
   ↓
[5] CORSMiddleware         → Allows only specified origins
   ↓
[6] verify_jwt()           → Validates JWT token
   ↓
[7] check_quota()          → Enforces daily limits
   ↓
Handler
```

### Rate Limiting Strategy

```
Global: 60 requests/minute per IP
User: 50 requests/day per user
Provider: Varies (Groq: 49/min, OR: 60/min, HF: 25/min)

If quota exceeded:
Response: 429 Too Many Requests
{
  "error": "Daily quota exceeded",
  "used": 50,
  "limit": 50
}
```

---

## ⚡ Performance & Scalability

### Database Optimization
- **Connection Pooling**: 20 min, 40 max connections
- **Async Queries**: Non-blocking database operations
- **Background Tasks**: Quota updates moved off critical path
- **Connection Recycling**: 1-hour timeout

### Request Handling
- **Async Endpoints**: All routes fully async
- **Streaming Responses**: Real-time AI output without buffering
- **Background Processing**: DB writes via FastAPI BackgroundTasks
- **Dependency Injection**: AI router per-request isolation

### Caching Strategy
- **Response Caching**: Redis for repeated prompts (planned)
- **Rate Limit Caching**: In-memory with Redis backup (planned)
- **Health Status Caching**: 30-second provider status cache

### Load Balancing
- **Stateless Design**: Any instance can handle any request
- **Session Affinity**: Not required (JWT stateless auth)
- **Auto-scaling**: Kubernetes HPA based on CPU/memory

---

## ⚙️ Configuration Deep Dive

### Environment Variables

```bash
# === CORE ===
ENV=production                    # development|production
LOG_LEVEL=INFO                   # DEBUG|INFO|WARNING|ERROR

# === DATABASE ===
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
DATABASE_POOL_SIZE=20            # Connection pool size
DATABASE_POOL_MAX_OVERFLOW=40    # Overflow connections
DATABASE_POOL_RECYCLE_SECONDS=3600

# === SECURITY ===
JWT_SECRET=min-32-characters-very-secure-string
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# === API KEYS (comma-separated) ===
GROQ_API_KEYS=key1,key2,key3
OPENROUTER_API_KEYS=key1,key2
HUGGINGFACE_API_KEY=single_key

# === ADMIN USERS ===
ADMIN_EMAILS=admin@example.com,owner@example.com

# === CORS ===
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# === RATE LIMITS ===
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_WINDOW_SECONDS=60
USER_DAILY_QUOTA=50
MAX_REQUEST_SIZE_BYTES=50000
REQUEST_TIMEOUT_SECONDS=30

# === MODEL SELECTION ===
GROQ_FAST_MODEL=llama-3.1-8b-instant
GROQ_BALANCED_MODEL=llama-3.1-70b
OPENROUTER_SMART_MODEL=openai/gpt-4o-mini

# === FEATURES ===
ENABLE_WEB_SEARCH=true
ENABLE_IMAGE_GENERATION=false

# === DEPLOYMENT (Render) ===
PORT=10000
RENDER_EXTERNAL_URL=https://your-service.onrender.com
```

---

## 🚢 Production Deployment

### Render Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create new Web Service on Render
- [ ] Configure:
  ```
  Runtime: Python 3.11
  Build: pip install -r requirements.txt
  Start: uvicorn app.main:app --host 0.0.0.0 --port 10000
  ```
- [ ] Add environment variables in Render dashboard
- [ ] Set DATABASE_URL to Supabase PostgreSQL
- [ ] Enable automatic deploys from GitHub
- [ ] Test: `curl https://your-service.onrender.com/health`

### Pre-Deployment Checks

```bash
# 1. Run tests locally
pytest tests/

# 2. Check all env vars set
python -c "from app.core.config import settings; print(settings)"

# 3. Verify database connection
python -c "from app.db.session import check_database_connection; \
  import asyncio; asyncio.run(check_database_connection())"

# 4. Lint code
flake8 app/

# 5. Type check
mypy app/

# 6. Build requirements
pip freeze > requirements.txt
```

---

## 📊 Monitoring & Logging

### Structured Logs

```
2025-12-24 12:50:20,838 | INFO | app.main | ✅ Configuration validated
2025-12-24 12:50:25,082 | INFO | app.db.session | ✅ Database connection verified
2025-12-24 12:50:27,032 | WARNING | app.main | HTTP 405: Method Not Allowed
```

### Log Levels

- **DEBUG:** Internal flow, SQL queries, API calls
- **INFO:** Startup events, user actions, important transitions
- **WARNING:** Quota exceeded, provider failures, non-critical issues
- **ERROR:** Unhandled exceptions, database errors, security violations

### Key Metrics to Monitor

```
Provider Status:
  ✅ All green → 99%+ uptime
  🟠 Orange → One provider degraded
  🔴 Red → One or more providers down

User Activity:
  Daily active users (DAU)
  Average quota used per user
  Top 10 most active users

API Performance:
  Response time (P50, P95, P99)
  Error rate (4xx, 5xx)
  Throughput (requests/sec)
  Database query time
```

---

## 🆘 Troubleshooting

### Database Connection Failed
```bash
Error: "cannot connect to server"

Solution:
1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running
3. Test with: psql $DATABASE_URL
4. Check firewall/security group settings
```

### JWT Token Expired
```bash
Error: 401 Unauthorized "Token has expired"

Solution:
1. Request new token via /auth/login
2. Token is valid for 24 hours
3. Frontend should refresh before expiry
4. Check server time is correct (NTP)
```

### Provider Rate Limit Hit
```bash
Error: 429 "AI provider rate limited"

Solution:
1. Add more API keys to .env (comma-separated)
2. Router automatically tries next key
3. Check provider dashboard for limits
4. Spread requests across time
```

### Quota Exceeded
```bash
Error: 429 "Daily quota exceeded"

Solution:
1. Check /api/v1/quota endpoint
2. Quota resets at midnight UTC
3. Admin can increase USER_DAILY_QUOTA
4. User must wait for reset
```

---

## 🔄 Provider Fallback Logic

```
When User Requests Response:

1. Try Primary Provider
   ├─ Success? → Return response ✅
   ├─ Rate limited? → Try next
   ├─ Error? → Try next
   └─ All failed? → Return 503

2. Fallback Chain:
   Fast:     Groq → (no fallback, fail)
   Balanced: Groq → OpenRouter → HF
   Smart:    OpenRouter → Groq → HF

3. Key Rotation:
   Multiple keys per provider
   Least-used key selected first
   Automatic cooldown on rate limit
```

---

## 🧪 Testing Locally

```bash
# 1. Start server
uvicorn app.main:app --reload

# 2. Get token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  | jq -r '.access_token')

# 3. Check quota
curl http://localhost:8000/api/v1/quota \
  -H "Authorization: Bearer $TOKEN"

# 4. Send chat message
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Hello!",
    "model": "fast",
    "stream": true
  }'

# 5. Check provider status
curl http://localhost:8000/api/v1/status
```

---

## 📚 Code Structure

```
backend/
├── main.py                 # FastAPI app entry point + middleware stack
├── app/                    # FastAPI application core
│   ├── db/
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   └── session.py      # Async database session
│   ├── middleware/
│   │   ├── request_id.py   # Request tracing
│   │   ├── security.py     # Security headers
│   │   └── request_validation.py
│   ├── deps/
│   │   └── auth.py         # Authentication dependency
│   └── providers/
│       ├── groq.py         # Groq API client
│       ├── openrouter.py   # OpenRouter API client
│       └── huggingface.py  # HuggingFace API client
├── api/v1/                 # API endpoints
│   ├── chat.py             # Chat endpoint
│   ├── auth.py             # Authentication endpoint
│   ├── status.py           # Provider status endpoint
│   ├── health.py           # Health check endpoint
│   └── web_search.py       # Web search endpoint
├── core/                   # Core configuration and utilities
│   ├── config.py           # Settings management
│   ├── security.py         # JWT utilities
│   ├── exceptions.py       # Global error handler
│   └── logging.py          # Logging setup
├── services/               # Business logic services
│   ├── ai_router.py        # Multi-provider routing
│   ├── provider_monitor.py # Health check background task
│   └── web_search.py       # DuckDuckGo search
└── cli/                    # GenZ AI CLI (Python)
    ├── main.py             # CLI entry point
    └── commands/
        ├── chat.py         # Chat command
        ├── serve.py        # Server command
        ├── status.py       # Status command
        ├── health.py       # Health command
        └── config.py       # Config command
```

---

## 🎯 Next Steps

- [ ] Add `/api/v1/feedback` endpoint for user ratings
- [ ] Implement request caching for identical prompts
- [ ] Add advanced analytics dashboard
- [ ] Support function calling/tools
- [ ] Image generation integration
- [ ] Voice input/output
- [ ] Team collaboration features
- [ ] Custom fine-tuned models

---

## 📞 Support & Issues

- GitHub Issues: https://github.com/yourusername/genzai/issues
- Email: support@genzai.app
- Docs: https://docs.genzai.app

---

**Backend is production-ready. 🚀**
