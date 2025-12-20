# backend/app/main.py

import time
import random
from collections import deque, defaultdict
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# =========================
# APP
# =========================
app = FastAPI(
    title="AII Backend",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# PROVIDER CONFIG
# =========================
PROVIDERS = {
    "groq": {
        "keys": ["GROQ_KEY_1", "GROQ_KEY_2", "GROQ_KEY_3"],
        "rpm": 50,
    },
    "openrouter": {
        "keys": ["OPENROUTER_KEY_1", "OPENROUTER_KEY_2"],
        "rpm": 30,
    },
    "huggingface": {
        "keys": ["HF_KEY_1"],
        "rpm": 20,
    },
    "scraper": {
        "keys": ["SCRAPER"],
        "rpm": 100,
    },
}

# =========================
# RATE LIMIT ENGINE
# =========================
WINDOW = 60  # seconds
usage: Dict[str, Dict[str, deque]] = defaultdict(lambda: defaultdict(deque))

def allow_request(provider: str, key: str, limit: int) -> bool:
    now = time.time()
    q = usage[provider][key]

    while q and q[0] <= now - WINDOW:
        q.popleft()

    if len(q) >= limit:
        return False

    q.append(now)
    return True

def get_available_provider() -> Dict:
    for provider, cfg in PROVIDERS.items():
        for key in cfg["keys"]:
            if allow_request(provider, key, cfg["rpm"]):
                return {
                    "provider": provider,
                    "key": key
                }
    raise HTTPException(status_code=429, detail="All providers rate-limited")

# =========================
# STATUS STORAGE
# =========================
STATUS_HISTORY: Dict[str, List[str]] = defaultdict(list)
MAX_POINTS = 120  # vertical bars

def record_status(name: str, ok: bool):
    STATUS_HISTORY[name].append("green" if ok else "red")
    if len(STATUS_HISTORY[name]) > MAX_POINTS:
        STATUS_HISTORY[name].pop(0)

# =========================
# HEALTH
# =========================
@app.get("/")
def root():
    return {"status": "ok"}

# =========================
# STATUS API (FOR FRONTEND BARS)
# =========================
@app.get("/status")
def status():
    response = {}
    for provider in PROVIDERS.keys():
        history = STATUS_HISTORY.get(provider, [])
        uptime = round(
            (history.count("green") / max(len(history), 1)) * 100, 2
        )
        response[provider] = {
            "bars": history,
            "uptime": uptime,
        }
    return response

# =========================
# AI REQUEST ROUTE
# =========================
@app.post("/ai")
def ai_request(prompt: str):
    try:
        slot = get_available_provider()
        provider = slot["provider"]

        # ---- MOCK RESPONSE (replace later with real API call) ----
        time.sleep(0.2)
        result = f"Response from {provider}"

        record_status(provider, True)
        return {
            "provider": provider,
            "response": result
        }

    except HTTPException:
        for p in PROVIDERS:
            record_status(p, False)
        raise

# =========================
# WEB SEARCH / SCRAPER
# =========================
@app.get("/search")
def web_search(q: str):
    provider = "scraper"
    try:
        allow = allow_request(provider, "SCRAPER", PROVIDERS["scraper"]["rpm"])
        if not allow:
            raise HTTPException(status_code=429, detail="Scraper rate-limited")

        # ---- SCRAPE PLACEHOLDER ----
        result = f"Scraped result for: {q}"
        record_status(provider, True)
        return {"result": result}

    except:
        record_status(provider, False)
        raise HTTPException(status_code=500, detail="Scraper failed")
