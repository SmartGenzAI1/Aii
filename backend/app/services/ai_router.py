# backend/app/services/ai_router.py

from app.core.system_prompt import SYSTEM_PROMPT

class AIRouter:
    def __init__(self, key_pool):
        self.key_pool = key_pool

    async def stream(self, prompt: str, model: str):
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        provider = self._select_provider(model)

        async for chunk in provider.stream_chat(
            messages=messages,
            model=model,
        ):
            yield chunk
