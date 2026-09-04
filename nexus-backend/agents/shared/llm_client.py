import json
import asyncio
import re
from typing import Type, TypeVar, Optional, Any
from groq import AsyncGroq, GroqError, RateLimitError
from pydantic import BaseModel
from config import settings

T = TypeVar("T", bound=BaseModel)

class LLMClient:
    """Wrapper for Groq API providing structured JSON generation with rate-limit backoff."""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.client = AsyncGroq(api_key=self.api_key) if self.api_key else None

    async def generate_structured_output(
        self,
        prompt: str,
        system_prompt: str,
        response_model: Type[T],
        use_premium_model: bool = False,
        max_retries: int = 3
    ) -> T:
        """
        Generate structured output adhering to response_model Pydantic schema using Groq API.
        Includes retry loop with exponential backoff for 429 RateLimitErrors.
        """
        if not self.client:
            raise ValueError("GROQ_API_KEY is not set in environment or config.py")

        model_name = settings.GROQ_PREMIUM_MODEL if use_premium_model else settings.GROQ_FAST_MODEL
        
        # Inject JSON schema guidance into system prompt
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        full_system_prompt = (
            f"{system_prompt}\n\n"
            f"CRITICAL REQUIREMENT: You MUST respond ONLY with valid JSON matching this JSON schema:\n"
            f"```json\n{schema_json}\n```\n"
            f"Do not include any pre-amble, markdown fences outside of JSON, or explanatory text."
        )

        models_to_try = [
            model_name,
            settings.GROQ_FALLBACK_PREMIUM_MODEL if use_premium_model else settings.GROQ_FALLBACK_FAST_MODEL,
            "openai/gpt-oss-20b"
        ]

        last_exception = None

        for model in models_to_try:
            retry_count = 0
            backoff = 1.5

            while retry_count < max_retries:
                try:
                    response = await self.client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": full_system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.2,
                        max_tokens=4000
                    )

                    content = response.choices[0].message.content
                    cleaned_json = self._clean_json_string(content)
                    data = json.loads(cleaned_json)
                    return response_model.model_validate(data)

                except RateLimitError as e:
                    last_exception = e
                    retry_count += 1
                    wait_time = backoff * (2 ** retry_count)
                    print(f"[LLM RATE LIMIT] 429 on model {model}. Retrying in {wait_time:.1f}s (Attempt {retry_count}/{max_retries})")
                    await asyncio.sleep(wait_time)

                except Exception as e:
                    last_exception = e
                    # If JSON parsing or validation failed, try extracting JSON substring
                    try:
                        cleaned = self._extract_json_substring(content if 'content' in locals() else "")
                        if cleaned:
                            data = json.loads(cleaned)
                            return response_model.model_validate(data)
                    except Exception:
                        pass
                    
                    print(f"[LLM ERROR] Model {model} attempt failed: {str(e)}")
                    break # Try next fallback model

        raise RuntimeError(f"LLM execution failed after trying all models. Last error: {str(last_exception)}")

    def _clean_json_string(self, text: str) -> str:
        """Strip markdown code block markers if present."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def _extract_json_substring(self, text: str) -> Optional[str]:
        """Extract first valid JSON object from string using regex."""
        match = re.search(r"\{.*\}", text, re.DOTALL)
        return match.group(0) if match else None

llm_client = LLMClient()
