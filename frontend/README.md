# 🎨 GenZ AI Frontend - Production Guide

> **Modern Next.js chat interface with real-time streaming, authentication, and responsive design.**

---

## 📋 Quick Reference

| Component | Tech | Status |
|-----------|------|--------|
| **Framework** | Next.js 14 | ✅ Modern |
| **Runtime** | React 18 | ✅ Optimized |
| **State** | Zustand | ✅ Lightweight |
| **Auth** | NextAuth + JWT | ⚠️ Needs config |
| **Styling** | Tailwind CSS | ✅ Responsive |
| **Deployment** | Vercel | ✅ Native support |

---

## 🏗️ Architecture

### Frontend Data Flow

```
┌──────────────────────────────────────────────────────┐
│ User Browser                                          │
│ ┌─────────────────────────────────────────────────┐  │
│ │ Chat Page (/chat)                               │  │
│ │ ┌──────────────────────────────────────────┐    │  │
│ │ │ 1. ModelSelector (fast/balanced/smart)  │    │  │
│ │ │ 2. Message History (scrollable list)    │    │  │
│ │ │ 3. Streaming Response (live chunks)     │    │  │
│ │ │ 4. Composer (input + send button)       │    │  │
│ │ └──────────────────────────────────────────┘    │  │
│ └──────────────────────────────────────────────────┘  │
│              │                                        │
│              │ State Management (Zustand)            │
│              ▼                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Chat Store (useChatStore)                       │  │
│ │ ├─ messages: Message[]                          │  │
│ │ ├─ model: "fast" | "balanced" | "smart"        │  │
│ │ ├─ isStreaming: boolean                         │  │
│ │ └─ actions: addMessage, appendToLast, setModel │  │
│ └──────────────────────────────────────────────────┘  │
│              │                                        │
└──────────────┼────────────────────────────────────────┘
               │ HTTPS API Call
               ▼
        ┌────────────────┐
        │ Backend Server │
        │ /api/v1/chat   │
        └────────────────┘
```

### Component Structure

```
app/
├── layout.tsx              (Root layout, nav, footer)
├── page.tsx                (Home / landing)
├── chat/
│   └── page.tsx            (Main chat interface)
├── settings/
│   └── page.tsx            (User settings & API keys)
├── about/
│   └── page.tsx            (About page)
├── policy/
│   └── page.tsx            (Privacy policy)
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts    (NextAuth configuration)

components/
├── Chat/
│   ├── Message.tsx         (Single message display)
│   ├── Composer.tsx        (Input + send)
│   ├── ModelSelector.tsx   (Model picker)
│   ├── CodeBlock.tsx       (Code syntax highlighting)
│   └── Thinking.tsx        (Loading state)
├── SystemStatus.tsx        (Backend status indicator)
└── UsageMeter.tsx          (Quota progress bar)

store/
├── chatStore.ts            (Message & model state)
└── settingsStore.ts        (User preferences)

lib/
├── api.ts                  (Backend API calls)
├── auth.ts                 (Authentication utilities)
├── byoClient.ts            (Bring-your-own API key)
├── localKeys.ts            (localStorage management)
└── constants.ts            (Feature flags)
```

---

## 🚀 Getting Started

### 1. Prerequisites

```bash
# Required
- Node.js 18+
- npm or yarn
- Backend URL (from Render deployment)

# Optional (for BYO mode)
- OpenRouter API key
- Groq API key
```

### 2. Local Setup (5 minutes)

```bash
# Clone
cd genzai/frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev

# Visit http://localhost:3000
```

### 3. Backend Connection Test

```bash
# In .env.local, set your backend URL:
NEXT_PUBLIC_BACKEND_URL=https://aii-snyi.onrender.com

# Test connection (from browser console):
fetch('https://aii-snyi.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Should see: {status: 'healthy', version: '1.0.0'}
```

---

## 🔑 Authentication Flow

### How Login Works (Step-by-Step)

```
1. User opens frontend → sees "Login" button
         ↓
2. Clicks button → goes to /auth/login
         ↓
3. Enters email address
         ↓
4. Clicks "Send Magic Link"
         ↓
5. NextAuth sends email with verification link
         ↓
6. User clicks link in email → backend validates
         ↓
7. Backend creates JWT token
         ↓
8. Frontend stores token in localStorage
         ↓
9. On every request: Authorization: Bearer {token}
         ↓
10. Backend validates JWT → grants access
         ↓
11. User can now chat!
```

### Setting Up Authentication

**Step 1: Configure NextAuth Email Provider**


**Step 2: Set Email Configuration**

```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=https://aii-snyi.onrender.com

# Email (using Gmail)
EMAIL_SERVER=smtp://your-email@gmail.com:your-app-password@smtp.gmail.com:587
EMAIL_FROM=noreply@genzai.app

# NextAuth Secret
NEXTAUTH_SECRET=random-32-char-secret-here
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

**Step 3: Add Login Button**



### Getting Your JWT Token (for API calls)



## 📡 Making API Requests

### Helper Function (lib/api.ts)

```typescript
// Already implemented - just use it
import { streamChat } from "@/lib/api";

const token = localStorage.getItem("auth_token");

await streamChat(
  "What is AI?",
  "fast",
  token,
  (chunk) => console.log(chunk)  // Called for each streamed chunk
);
```

### Complete Example



## ⚙️ Configuration

### Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
EMAIL_SERVER=smtp://user:pass@smtp.gmail.com:587
EMAIL_FROM=noreply@yourdomain.com

# .env.production (optional - usually auto-detected)
NEXT_PUBLIC_BACKEND_URL=https://aii-snyi.onrender.com
NEXTAUTH_URL=https://yourdomain.vercel.app
```

### Feature Flags (lib/constants.ts)

```typescript
export const FEATURES = {
  chat: true,        // ✅ Enabled
  image: false,      // ⏳ Coming soon
  voice: false,      // ⏳ Coming soon
};
```

---

## 🎨 Styling & Components

### Using Components

`

### Tailwind Classes Used

```typescript
// Typography
text-xs, text-sm, text-base, text-lg, text-xl
font-semibold, font-medium, font-normal

// Layout
flex, gap-2, px-3, py-2, rounded
max-w-3xl, mx-auto, space-y-4

// Styling
bg-gray-200, bg-black, text-white, text-gray-500
border, border-t, rounded-lg

// Responsive
grid, grid-cols-1, md:grid-cols-2
hidden, md:flex
```

---

## 📱 Responsive Design

### Mobile-First Approach

```typescript
// All components work on mobile
// Grid automatically adjusts:
//   - Mobile: 1 column
//   - Tablet: 2 columns
//   - Desktop: 3 columns

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive layout */}
</div>
```

---

## 🚢 Production Deployment

### Deploy to Vercel (Recommended)

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for production"
git push
```

**Step 2: Connect to Vercel**
- Go to https://vercel.com/new
- Select your GitHub repo
- Click "Import"

**Step 3: Set Environment Variables**
```
NEXT_PUBLIC_BACKEND_URL = https://aii-snyi.onrender.com
NEXTAUTH_SECRET = (generate with: openssl rand -base64 32)
NEXTAUTH_URL = https://your-domain.vercel.app
EMAIL_SERVER = smtp://...
EMAIL_FROM = noreply@yourdomain.com
```

**Step 4: Deploy**
- Click "Deploy"
- Wait for build (~2 minutes)
- Your site is live!

### Auto-Deploy on Git Push

```bash
# Every push to main triggers automatic deployment
git push  # → Vercel automatically rebuilds & deploys
```

### Alternative: Deploy to Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Link to Netlify
netlify link

# 3. Configure build
# Build command: next build
# Publish directory: .next

# 4. Deploy
netlify deploy --prod
```

---

## 🧪 Testing Locally

### Test 1: Backend Connection

```bash
# In browser console:
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Should show: {status: "healthy", ...}
```

### Test 2: Authentication

```bash
# In browser console:
// Get token
const response = await fetch(
  'http://localhost:8000/api/v1/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' })
  }
);
const data = await response.json();
console.log(data.access_token);  // Should get JWT
```

### Test 3: Send Message

```bash
# Get token first, then:
fetch('http://localhost:8000/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    prompt: 'Hello!',
    model: 'fast',
    stream: true
  })
}).then(r => r.body.getReader()).read()
```

---

## 📊 State Management (Zustand)

### Chat Store

```typescript
// Use it anywhere:
import { useChatStore } from "@/store/chatStore";

function MyComponent() {
  const messages = useChatStore(s => s.messages);
  const addMessage = useChatStore(s => s.addMessage);
  
  return (
    <div>
      {messages.map(m => <p>{m.content}</p>)}
      <button onClick={() => addMessage({
        role: "user",
        content: "Hi!"
      })}>
        Add message
      </button>
    </div>
  );
}
```

### Settings Store

``

---

## 🔄 Two API Modes

### Mode 1: Platform AI (Recommended)

```
User → Frontend → Backend JWT → Groq/OpenRouter/HF
         ↓
    Backend handles API keys (secure)
    Backend enforces quotas
    Backend routes intelligently
```

**How to use:**
```typescript
// Automatic - just pass token
const token = localStorage.getItem("auth_token");
await streamChat(prompt, model, token, onChunk);
```

### Mode 2: Bring Your Own API Key (BYO)

```
User → Frontend (with API key) → Groq/OpenRouter/HF
         ↓
    No backend involvement
    Direct API calls
    User responsible for quotas
```

**How to use:**
```typescript
// In settings, paste your OpenRouter API key
// It's stored in localStorage (browser-only)
// Never sent to backend

await streamBYOChat(prompt, model, onChunk);
```

---

## 🐛 Troubleshooting

### Issue: "Network Error" when sending message

```
Solution:
1. Check NEXT_PUBLIC_BACKEND_URL in .env.local
2. Backend must be running (or deployed on Render)
3. CORS must be configured on backend
4. Check network tab in DevTools
```

### Issue: "401 Unauthorized"

```
Solution:
1. User not logged in
2. Token expired (need new login)
3. Token not being sent in headers
4. Token malformed or invalid
```

### Issue: "429 Too Many Requests"

```
Solution:
1. Daily quota exceeded (shows in /quota endpoint)
2. Wait until midnight UTC for reset
3. Admin can increase USER_DAILY_QUOTA
4. Use BYO mode to bypass platform limits
```

### Issue: Message not streaming

```
Solution:
1. Check streaming is enabled: stream: true
2. Verify response.body exists
3. Check browser DevTools Network tab
4. Ensure backend is returning Server-Sent Events
```

---

## 📦 Build & Production

### Build for Production

```bash
npm run build

# Creates optimized .next/ directory
# File size: ~2-3 MB (gzipped)
# Ready to deploy
```

### Performance Optimizations

- ✅ Image optimization (Next.js)
- ✅ Code splitting per route
- ✅ CSS purging (Tailwind)
- ✅ Bundle analysis available

```bash
# Analyze bundle
npm install --save-dev @next/bundle-analyzer

# Then check .next/static/
```

---

## 📚 Code Examples

### Complete Chat Flow

``

## 🎯 Next Steps

- [ ] Add image upload (drag-and-drop)
- [ ] Voice input/output
- [ ] Chat history (localStorage)
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Custom system prompts
- [ ] Export chat as PDF
- [ ] Share chat links

---

## 📞 Support

- **Issues:** GitHub Issues
- **Email:** support@genzai.app
- **Docs:** https://docs.genzai.app

---

**Frontend is nearly ready.  🚀**
