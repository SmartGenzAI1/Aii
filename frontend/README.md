GenZ AI  Frontend

     


---

Overview

The GenZ AI Frontend is a lightweight, production-ready web interface designed to:

Visualize AI provider health and uptime

Display system operational status (Groq-style bars)

Act as a public transparency dashboard

Consume backend APIs securely and efficiently


The frontend is intentionally framework-free for maximum performance, minimal attack surface, and zero vendor lock-in.


---

Key Features

System Status Dashboard

Vertical status bars per provider

Green / Orange / Red health indicators

Real-time status updates via backend API

Uptime percentage display


Clean Separation of Concerns

Backend provides JSON only

Frontend handles visualization

No business logic duplication


Production-Friendly

Static files (can be hosted anywhere)

CDN compatible

No build step required



---

Architecture

flowchart LR
    Browser -->|Fetch| StatusAPI
    StatusAPI --> Backend
    Backend --> Database


---

Project Structure

frontend/
├── index.html          # Landing page
├── status.html         # System status dashboard
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── status.js
├── README.md


---

Status Dashboard Design

Data Source

GET /api/v1/status

Example Response

[
  {
    "provider": "groq",
    "status": "up",
    "uptime": 99.82,
    "last_checked": "2025-01-10T12:10:00Z"
  }
]

Visual Mapping

Status	Color

up	Green
degraded	Orange
down	Red



---

Local Development

You can run the frontend without any tooling.

Option 1 — Simple HTTP Server

cd frontend
python -m http.server 8080

Visit:

http://localhost:8080/status.html

Option 2 — Direct File Open

You may also open status.html directly in the browser (limited by CORS if backend is remote).


---

API Configuration

Update the API base URL inside:

assets/js/status.js

const API_BASE = "https://aii-snyi.onrender.com/api/v1";


---

Deployment Options

Recommended

Render Static Site

Vercel

Netlify

Cloudflare Pages

GitHub Pages


Why Static?

Zero runtime risk

Near-zero latency

Maximum security



---

Security Notes

No API keys in frontend

No authentication tokens stored

Backend enforces access control

Frontend is read-only



---

Performance Considerations

No framework overhead

Minimal DOM updates

Cached API responses supported

Mobile friendly



---

Accessibility

Semantic HTML

High-contrast status colors

Screen-reader compatible labels



---

Production Checklist

[x] Static hosting

[x] API URL configured

[x] CORS allowed from frontend domain

[x] HTTPS enforced

[x] Error handling for API failures



---

License

MIT License © GenZ AI


Maintainers

GenZ AI Team
Frontend designed for clarity, speed, and trust transparency.

