#backend/app/api/chat.py
from fastapi import APIRouter, HTTPException
from app.services.router import route_request

router = APIRouter()

@router.post("/chat")
async def chat(body: dict):
    prompt = body.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt missing")

    reply = await route_request(prompt)
    return {"reply": reply}
