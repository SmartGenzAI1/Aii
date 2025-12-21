Aii Frontend

    

Aii Frontend is a lightweight, production-ready web interface for interacting with the Aii AI backend.
It provides chat/testing UI, real-time provider status bars, and system health visibility similar to Groq and OpenAI dashboards.


---

Responsibilities

Consume FastAPI backend APIs

Display provider health & uptime

Visual status bars (green / orange / red)

Chat / prompt testing UI

Zero secret exposure (no API keys in frontend)



---

Architecture Overview (Mermaid)

flowchart TD
    Browser[User Browser]
    UI[Frontend UI]
    StatusUI[Status Dashboard]
    ChatUI[Chat / Prompt UI]
    Backend[FastAPI Backend]

    Browser --> UI
    UI --> StatusUI
    UI --> ChatUI

    StatusUI -->|GET /api/v1/status| Backend
    ChatUI -->|POST /api/v1/provider| Backend


---

Frontend Structure

frontend/
├── index.html          # Main UI
├── status.html         # Provider status dashboard
├── styles/
│   └── main.css
├── scripts/
│   ├── app.js          # Chat / request logic
│   └── status.js       # Status polling + bars
└── README.md


---

Provider Status Dashboard

The frontend polls:

GET /api/v1/status

Example response:

[
  {
    "provider": "groq-1",
    "status": "green",
    "uptime": 99.2,
    "last_checked": "2025-01-14T12:20:00Z"
  }
]

Status Bar Mapping

Status	Color	Meaning

green	🟢	Healthy
orange	🟠	Degraded / rate-limited
red	🔴	Down


Bars are rendered vertically, similar to Groq / OpenAI system pages.


---

Chat / Prompt Flow

sequenceDiagram
    User->>Frontend: Enter prompt
    Frontend->>Backend: POST /api/v1/provider
    Backend->>Provider: Route request
    Provider-->>Backend: AI response
    Backend-->>Frontend: Final response
    Frontend-->>User: Display output


---

Security Model

❌ No API keys in frontend

❌ No direct provider access

✅ Backend handles routing & limits

✅ Frontend is stateless



---

Local Development

Simply open in browser:

cd frontend
open index.html

Or with a local server (recommended):

python -m http.server 5500

Then visit:

http://localhost:5500


---

Production Deployment

Recommended

Vercel

Netlify

Cloudflare Pages


Backend Base URL

Update in scripts/*.js:

const API_BASE = "https://aii-snyi.onrender.com";


---

UI Features

Live provider health

Automatic refresh

Error-safe rendering

Mobile-friendly layout

Minimal, fast, no frameworks



---

Roadmap (Frontend)

Dark mode

Provider filter

Latency graph

User auth (optional)

Admin-only metrics view



---

License

MIT — free for commercial and private use.


---

 
