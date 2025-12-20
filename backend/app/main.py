# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import random
import httpx
import os
import logging

# -------------------------------------------------
# App setup
# -------------------------------------------------
app = FastAPI(title="GenZ AI Backend", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("genz-ai")

# -------------------------------------------------
# ENV CONFIG (Render / Prod safe)
# -------------------------------------------------
GROQ_KEYS = os.getenv("GROQ_API_KEYS", "").split(",")
OPENROUTER_KEYS = os.getenv("OPENROUTER_API_KEYS", "").split(",")
HF_KEY = os.getenv("HUGGINGFACE_API_KEY")

APP_URL = os.getenv("APP_URL", "https://aii-snyi.onrender.com")

GROQ_MODEL = "llama-3.1-8b-instant"
OR_MODEL_FAST = "meta-llama/llama-3-8b-instruct"
OR_MODEL_SMART = "meta-llama/llama-3-70b-instruct"

# -------------------------------------------------
# Rate limit config (RPM)
# -------------------------------------------------
LIMITS = {
    "groq": 49,
    "openrouter": 60,
    "huggingface": 30,
}

usage = {
    "groq": {},
    "openrouter": {},
    "huggingface": {},
}

def _clean(ts):
    now = time.time()
    return [t for t in ts if now - t < 60]

def can_use(provider, key):
    usage[provider].setdefault(key, [])
    usage[provider][key] = _clean(usage[provider][key])
    return len(usage[provider][key]) < LIMITS[provider]

def mark_use(provider, key):
    usage[provider][key].append(time.time())

# -------------------------------------------------
# Provider calls
# -------------------------------------------------
async def groq_call(prompt: str):
    random.shuffle(GROQ_KEYS)
    for key in GROQ_KEYS:
        if not can_use("groq", key):
            continue
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
            r.raise_for_status()
            mark_use("groq", key)
            return r.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"Groq failed: {e}")
    raise RuntimeError("Groq unavailable")

async def openrouter_call(prompt: str, smart=False):
    model = OR_MODEL_SMART if smart else OR_MODEL_FAST
    random.shuffle(OPENROUTER_KEYS)
    for key in OPENROUTER_KEYS:
        if not can_use("openrouter", key):
            continue
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {key}",
                        "HTTP-Referer": APP_URL,
                        "X-Title": "GenZ AI",
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
            r.raise_for_status()
            mark_use("openrouter", key)
            return r.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"OpenRouter failed: {e}")
    raise RuntimeError("OpenRouter unavailable")

async def hf_call(prompt: str):
    if not can_use("huggingface", HF_KEY):
        raise RuntimeError("HF limit")
    async with httpx.AsyncClient(timeout=25) as client:
        r = await client.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-large",
            headers={"Authorization": f"Bearer {HF_KEY}"},
            json={"inputs": prompt},
        )
    r.raise_for_status()
    mark_use("huggingface", HF_KEY)
    return r.json()[0]["generated_text"]

# -------------------------------------------------
# Router logic (fallback + modes)
# -------------------------------------------------
async def generate(prompt: str, mode: str):
    try:
        if mode == "fast":
            return await groq_call(prompt)

        if mode == "balanced":
            try:
                return await openrouter_call(prompt)
            except:
                return await groq_call(prompt)

        if mode == "smart":
            try:
                return await openrouter_call(prompt, smart=True)
            except:
                return await hf_call(prompt)

        raise ValueError("Invalid mode")

    except Exception as e:
        logger.error(e)
        return "AI is temporarily unavailable. Please try again."

# -------------------------------------------------
# API Models
# -------------------------------------------------
class ChatRequest(BaseModel):
    prompt: str
    mode: str = "balanced"

# -------------------------------------------------
# API Routes
# -------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/chat")
async def chat(req: ChatRequest):
    response = await generate(req.prompt, req.mode)
    return {
        "assistant": "GenZ",
        "mode": req.mode,
        "response": response,
    }

@app.get("/status")
def status():
    def pct(provider):
        used = sum(len(v) for v in usage[provider].values())
        limit = LIMITS[provider]
        return min(100, int((used / limit) * 100)) if used else 100

    return {
        "groq": pct("groq"),
        "openrouter": pct("openrouter"),
        "huggingface": pct("huggingface"),
}
