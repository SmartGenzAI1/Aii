# backend/app/services/stream.py

from fastapi.responses import StreamingResponse
from typing import AsyncIterator


def stream_response(generator: AsyncIterator[str]) -> StreamingResponse:
    """
    Wraps async generator into FastAPI streaming response.
    """

    async def event_stream():
        async for chunk in generator:
            yield f"data: {chunk}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
    )
