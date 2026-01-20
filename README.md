# GenZ AI

**The Ultimate AI Chat Experience for Gen Z 🤖✨**

<p align="center">
  <img src="frontend/public/LIGHT_BRAND_LOGO.png" alt="GenZ AI" width="200">
</p>

<p align="center">
  🔥 Slay the AI game with multi-provider magic, instant failover, and vibes that match your energy
</p>

---

## 🌟 Overview

GenZ AI is a cutting-edge AI orchestration platform built for the modern generation:

- 🤖 **Multi-Provider AI Routing** - Groq, OpenRouter, HuggingFace with automatic failover
- ⚡ **Real-Time Health Monitoring** - Live provider status and uptime tracking
- 🔒 **Enterprise-Grade Security** - JWT auth, rate limiting, and secure API key management
- 🎨 **Gen Z UI/UX** - Modern, vibrant interface with AI-powered features
- 🏗️ **Clean Monorepo Architecture** - Separated frontend and backend for scalability

---

## 📁 Project Structure

```
genz-ai/
├── frontend/          # Next.js React App
│   ├── app/          # Next.js App Router
│   ├── components/   # Reusable UI Components
│   ├── lib/          # Utility Functions
│   ├── public/       # Static Assets
│   └── package.json  # Frontend Dependencies
│
├── backend/           # FastAPI Python Server + CLI
│   ├── main.py       # FastAPI Application Entry Point
│   ├── app/          # FastAPI Core Application
│   │   ├── db/       # Database Models & Sessions
│   │   ├── middleware/# Security & Request Middleware
│   │   ├── deps/     # Dependencies
│   │   └── providers/# AI Provider Clients
│   ├── api/v1/       # API Endpoints
│   ├── core/         # Configuration & Security
│   ├── services/     # AI Services & Routing
│   ├── cli/          # GenZ AI CLI (Python)
│   │   ├── main.py   # CLI Entry Point
│   │   └── commands/ # CLI Commands
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase CLI (for local database)

### 1. Clone & Setup

```bash
git clone https://github.com/your-repo/genz-ai.git
cd genz-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment (copy and edit)
cp .env.example .env
# Edit .env with your API keys and database URL

# Run backend server
uvicorn main:app --reload --port 8000

# Or use the GenZ AI CLI
python -m backend.cli.main serve --reload --port 8000
```

**Backend runs on:** http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Add your Supabase URL and keys

# Run frontend
npm run dev
```

**Frontend runs on:** http://localhost:3000

### 4. Full Development (with Supabase)

```bash
# Install Supabase CLI
# Run full stack with local database
npm run chat  # From frontend directory
```

---

## 🔧 Backend API

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat` | POST | AI chat with streaming |
| `/api/v1/models` | GET | Available AI models |
| `/api/v1/quota` | GET | User quota info |
| `/api/v1/status` | GET | Provider health status |
| `/api/v1/health` | GET | Backend health check |

### Authentication

- JWT-based authentication
- User registration and login
- Rate limiting per user
- Daily quota enforcement

### GenZ AI CLI

The backend includes a production-grade Python CLI:

```bash
cd backend

# Show all commands
python -m backend.cli.main --help

# Start the server
python -m backend.cli.main serve --port 8000

# Check backend health
python -m backend.cli.main health

# Check AI provider status
python -m backend.cli.main status

# Send a chat message (requires JWT token)
python -m backend.cli.main chat --token YOUR_JWT_TOKEN "Hello AI!"

# Manage configuration
python -m backend.cli.main config get host
python -m backend.cli.main config set host http://localhost:8000
```

### AI Request Lifecycle

1. **Auth Check** → 2. **Rate Limit** → 3. **Model Resolution** → 4. **Provider Routing** → 5. **Stream Response** → 6. **Quota Update**

---

## 🎨 Frontend Features

- **AI-Generated Chat Titles** - Fun, Gen Z-style names for conversations
- **Vision Mode** - Image input support for compatible models
- **Modern UI** - Clean, responsive design with smooth animations
- **Real-Time Chat** - Streaming responses with typing indicators
- **Multi-Modal Support** - Text, images, and file uploads

---

## 🔐 Environment Variables

### Backend (.env.backend)

```env
DATABASE_URL=postgresql+psycopg://...
JWT_SECRET=your-secret-key
GROQ_API_KEYS=key1,key2,key3
OPENROUTER_API_KEYS=key1,key2
HUGGINGFACE_API_KEY=your-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
```

---

## 🚀 Deployment

### Backend (Recommended: Render)

```bash
uvicorn main:app --host 0.0.0.0 --port 10000
```

### Frontend (Recommended: Vercel)

```bash
npm run build
npm start
```

### Database

- **Production**: Supabase or Neon PostgreSQL
- **Local Dev**: Supabase CLI

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend health check
curl http://localhost:8000/health

# Or use CLI
python -m backend.cli.main health
```

---

## 📊 Monitoring

- **Provider Health Dashboard** - Real-time status monitoring
- **Uptime Tracking** - Historical performance data
- **Rate Limit Monitoring** - Per-user and per-provider limits

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📜 License

**MIT License** - See LICENSE file for details

---

**Built for Gen Z, by Gen Z** 🚀
