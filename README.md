GenZ AI Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13-blue" />
  <img src="https://img.shields.io/badge/FastAPI-0.126-green" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-blue" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-red" />
  <img src="https://img.shields.io/badge/License-MIT-black" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" />
</p>

🚀 Overview

GenZ AI is a production‑ready, multi‑provider AI orchestration platform designed for reliability, scalability, and strict rate‑limit control.

The system intelligently routes requests across multiple AI providers (Groq, OpenRouter, HuggingFace, Web‑Scraping Search) with automatic fallback, provider health monitoring, and user‑level quotas.

This repository contains both backend and frontend, fully separated and deployable independently.


---

🧠 Core Features

🔁 Multi‑Provider AI Routing

Groq (multiple keys)

OpenRouter (multiple keys)

HuggingFace Inference

Web search / scraping adapter


🧯 Automatic Failover

Provider fallback on errors or rate‑limit exhaustion


⏱️ Rate‑Limit Enforcement

Per‑provider internal limits

Per‑user daily request caps


📊 Live Status System

Provider uptime tracking

Health states (Healthy / Degraded / Down)

Visual bar‑based frontend status page


🔐 Secure Authentication

JWT‑based auth

Magic‑link ready (optional)


🧱 Scalable Architecture

Adapter‑based provider system

Clean API versioning (/api/v1)


🗃️ Database‑Light Design

Chats stored locally in browser

Backend DB stores only users, limits, provider health




---

🏗️ Architecture

Frontend (Vercel)
   │
   │ HTTPS
   ▼
Backend API (FastAPI – Render)
   │
   ├── Provider Router
   │     ├── Groq Adapter
   │     ├── OpenRouter Adapter
   │     ├── HuggingFace Adapter
   │     └── Web Search Adapter
   │
   ├── Rate Limiter
   ├── Auth / JWT
   ├── Status Tracker
   │
   ▼
PostgreSQL (Supabase)


---

📁 Project Structure

backend/
  app/
    api/v1/
      chat.py
      status.py
      auth.py
    services/
      provider_router.py
      adapters/
        groq.py
        openrouter.py
        huggingface.py
        websearch.py
    core/
      config.py
      security.py
    db/
      session.py
      models/
frontend/
  status.html
  index.html
README.md


---

🔑 Environment Variables

Backend never exposes provider APIs to users.

DATABASE_URL=
JWT_SECRET=
GROQ_API_KEY_1=
GROQ_API_KEY_2=
GROQ_API_KEY_3=
OPENROUTER_API_KEY_1=
OPENROUTER_API_KEY_2=
HUGGINGFACE_API_KEY=


---

📊 Provider Status System

Each provider is continuously monitored and stored in the database:

Healthy → green bar

Degraded → orange bar

Down → red bar


Uptime percentage is calculated from historical checks.

API endpoint:

GET /api/v1/status


---

🧪 Local Development

Backend

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend

Open frontend/index.html or status.html directly in browser.


---

🚀 Deployment

Backend (Render)

Runtime: Python 3.13

Start Command:


uvicorn app.main:app --host 0.0.0.0 --port 10000

Database (Supabase)

PostgreSQL

SSL enabled


Frontend (Vercel)

Static HTML / JS



---

🔒 Security Design

Provider API keys never reach frontend

JWT secrets stored only in backend env

Rate‑limit enforced before provider execution

Automatic provider isolation on failure



---

🛣️ Roadmap

Image generation

Voice input/output

Admin dashboard

Usage analytics

Paid plans



---

📜 License

MIT License


---

👥 Team

GenZ AI

Built for speed, reliability, and real‑world scale.


---
