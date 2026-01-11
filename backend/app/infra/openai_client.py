"""OpenAI API client wrapper."""

import json
from typing import Any, Optional

from openai import AsyncOpenAI

from app.core.config import settings


class OpenAIClient:
    """Wrapper for OpenAI API calls. Supports both env-based and user-provided keys."""

    def __init__(self):
        self._default_client: Optional[AsyncOpenAI] = None

    def _get_client(self, api_key: Optional[str] = None) -> AsyncOpenAI:
        """Get OpenAI client with the specified or default API key."""
        if api_key:
            # User-provided key: create a new client instance
            return AsyncOpenAI(api_key=api_key)

        # Use default (env-based) client
        if self._default_client is None:
            if not settings.openai_api_key:
                raise ValueError(
                    "请提供 OpenAI API Key（在页面顶部输入）或在后端设置环境变量 OPENAI_API_KEY"
                )
            self._default_client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._default_client

    async def chat_json(
        self,
        messages: list[dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        api_key: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send chat completion request expecting JSON response."""
        client = self._get_client(api_key)

        response = await client.chat.completions.create(
            model=model or settings.openai_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")


# Singleton instance
openai_client = OpenAIClient()

