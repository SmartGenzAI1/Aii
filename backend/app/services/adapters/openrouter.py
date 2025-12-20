#backend/app/services/adapters/openrouter.py

import httpx

async def generate(prompt: str, api_key: str):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://genz.ai",
        "X-Title": "GenZ AI"
    }

    data = {
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
        )
        return r.json()["choices"][0]["message"]["content"]
