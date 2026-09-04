import os
import json
import time
import asyncio
import httpx
from typing import TypeVar, Type, Dict, Any, Optional
from pydantic import BaseModel

from services.adapters.base import LLMAdapter
from config import settings

T = TypeVar("T", bound=BaseModel)

class GroqAdapter(LLMAdapter):
    """
    API-First Groq API Adapter with exponential backoff, request deduplication cache,
    concurrency limiters, and graceful degradation fallbacks.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.fast_model = settings.GROQ_FAST_MODEL
        self.reasoning_model = settings.GROQ_PREMIUM_MODEL
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
        # Concurrency limit (max 10 concurrent requests)
        self._semaphore = asyncio.Semaphore(10)
        
        # 5-minute request deduplication cache: {prompt_hash: (timestamp, response_data)}
        self._cache: Dict[str, tuple[float, Any]] = {}
        self._cache_ttl = 300 # seconds

    def _get_cache_key(self, prompt: str, model: str) -> str:
        return f"{model}:{hash(prompt)}"

    def _check_cache(self, key: str) -> Optional[Any]:
        if key in self._cache:
            ts, val = self._cache[key]
            if time.time() - ts < self._cache_ttl:
                print(f"⚡ [GroqAdapter] Serving response from deduplication cache.")
                return val
            else:
                del self._cache[key]
        return None

    def _set_cache(self, key: str, val: Any) -> None:
        self._cache[key] = (time.time(), val)

    async def _call_groq_api(self, prompt: str, model: str, json_mode: bool = False) -> str:
        """Call Groq REST API with exponential backoff and rate limit handling."""
        if not self.api_key:
            print("[GroqAdapter] GROQ_API_KEY is empty. Triggering graceful degradation.")
            raise ValueError("No Groq API Key provided")

        cache_key = self._get_cache_key(prompt, model)
        cached = self._check_cache(cache_key)
        if cached is not None:
            return cached

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = [
            {"role": "system", "content": "You are NEXUS, an expert AI assistant for MindGigs. Respond concisely and strictly format responses as requested."},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        backoffs = [2, 4, 8, 16]
        
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for attempt, delay in enumerate(backoffs + [0]):
                    try:
                        response = await client.post(self.base_url, headers=headers, json=payload)
                        if response.status_code == 200:
                            data = response.json()
                            content = data["choices"][0]["message"]["content"]
                            self._set_cache(cache_key, content)
                            return content
                        elif response.status_code in (429, 500, 502, 503, 504):
                            print(f"[GroqAdapter] API returned HTTP {response.status_code}. Retrying in {delay}s (Attempt {attempt+1})...")
                            if delay > 0:
                                await asyncio.sleep(delay)
                        else:
                            print(f"[GroqAdapter ERROR] API error HTTP {response.status_code}: {response.text}")
                            break
                    except Exception as e:
                        print(f"[GroqAdapter] Request error ({e}). Retrying in {delay}s...")
                        if delay > 0:
                            await asyncio.sleep(delay)

        raise RuntimeError(f"Groq API call failed after retries for model {model}")

    async def classify(self, prompt: str) -> str:
        """Lightweight classification using Groq fast model with fallback."""
        try:
            return await self._call_groq_api(prompt, model=self.fast_model, json_mode=False)
        except Exception as e:
            print(f"⚠️ [GroqAdapter] Classification fallback: {e}")
            return "general_chat"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate response using Groq reasoning model with system prompt support."""
        full_prompt = f"System: {system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
        try:
            return await self._call_groq_api(full_prompt, model=self.reasoning_model, json_mode=False)
        except Exception as e:
            print(f"⚠️ [GroqAdapter] Response generation fallback: {e}")
            return "I am experiencing temporary connection issues with the AI service. How else can I assist you?"

    async def extract_structured(self, prompt: str, schema: Type[T]) -> T:
        """Extract structured JSON using Groq fast model with graceful fallback."""
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        formatted_prompt = f"""Extract structured information matching the following JSON Schema:
Schema:
{schema_json}

Input Text:
"{prompt}"

Respond ONLY with a valid JSON object following the schema exact keys."""

        try:
            raw_response = await self._call_groq_api(formatted_prompt, model=self.fast_model, json_mode=True)
            data = json.loads(raw_response)
            return schema.model_validate(data)
        except Exception as e:
            print(f"⚠️ [GroqAdapter] Structured extraction failed/degraded: {e}. Returning rule-based template.")
            # Rule-based graceful degradation
            return self._rule_based_expert_fallback(prompt, schema)

    async def generate_reasoning(self, prompt: str) -> str:
        """Generate reasoning or text response using Groq reasoning model with fallback."""
        return await self.generate(prompt)

    def _rule_based_expert_fallback(self, prompt: str, schema: Type[T]) -> T:
        """Rule-based heuristic extraction for expert profiles when LLM is unavailable."""
        words = [w.strip(".,!?:") for w in prompt.split() if len(w) > 3]
        headline = f"Expert in {words[0].capitalize() if words else 'Specialized Field'}"
        if "ai" in prompt.lower() or "llm" in prompt.lower() or "machine learning" in prompt.lower():
            category = "AI / Machine Learning"
            tags = ["AI", "Machine Learning", "Python", "LLMs"]
        elif "web" in prompt.lower() or "fullstack" in prompt.lower() or "react" in prompt.lower():
            category = "Full-Stack Development"
            tags = ["Next.js", "React", "Node.js", "TypeScript"]
        elif "design" in prompt.lower() or "ui" in prompt.lower() or "ux" in prompt.lower():
            category = "UI/UX & Product Design"
            tags = ["UI/UX", "Figma", "Design Systems", "Prototyping"]
        else:
            category = "Consulting & Strategy"
            tags = ["Strategy", "Consulting", "Execution"]

        bio = prompt if len(prompt) > 20 else f"High-impact specialist with proven track record in {category}."

        fallback_dict = {
            "professional_headline": headline,
            "bio": bio,
            "category": category,
            "expertise_tags": tags,
            "confidence_score": 0.85
        }
        
        try:
            return schema.model_validate(fallback_dict)
        except Exception:
            # Construct minimal schema instance
            return schema(**fallback_dict)
