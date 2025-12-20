# backend/app/services/providers/base.py
"""
Base provider interface.
All providers MUST implement generate().
"""

from abc import ABC, abstractmethod


class BaseProvider(ABC):

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        pass
