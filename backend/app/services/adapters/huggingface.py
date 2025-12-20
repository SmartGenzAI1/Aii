#backend/app/services/adapters/huggingface.py

import httpx

async def generate(prompt: str, api_key: str):
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            headers=headers,
            json={"inputs": prompt},
        )
        return r.json()[0]["generated_text"]
