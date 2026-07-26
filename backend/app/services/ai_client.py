"""
Thin wrapper around the Anthropic API, with automatic fallback to Gemini
when Claude is unavailable (e.g. low credit balance, rate limits, outages).
Every agent goes through this single choke point so prompting conventions,
retries, and JSON-parsing stay consistent across the whole pipeline.
"""
import json
import re
from typing import Type, TypeVar
import anthropic
from pydantic import BaseModel
from app.config import get_settings

T = TypeVar("T", bound=BaseModel)
_settings = get_settings()

_client = anthropic.Anthropic(api_key=_settings.anthropic_api_key) if _settings.anthropic_api_key else None

_gemini_model = None
_gemini_api_key = getattr(_settings, "gemini_api_key", None)
if _gemini_api_key:
    import google.generativeai as genai
    genai.configure(api_key=_gemini_api_key)
    _gemini_model = genai.GenerativeModel(getattr(_settings, "gemini_model", None) or "gemini-2.0-flash")


class AIClientError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    return text


def _call_claude(full_system: str, user_prompt: str, max_tokens: int, temperature: float) -> str:
    response = _client.messages.create(
        model=_settings.ai_model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=full_system,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    )


def _call_gemini(full_system: str, user_prompt: str, max_tokens: int, temperature: float) -> str:
    response = _gemini_model.generate_content(
        f"{full_system}\n\n{user_prompt}",
        generation_config={
            "max_output_tokens": max_tokens,
            "temperature": temperature,
        },
    )
    return response.text


_PROVIDER_ERRORS = (
    anthropic.APIStatusError,
    anthropic.APIConnectionError,
    anthropic.RateLimitError,
)


async def generate_structured(
    system_prompt: str,
    user_prompt: str,
    schema: Type[T],
    max_tokens: int = 4096,
    temperature: float = 0.0,
) -> T:
    """
    Calls the model, forcing pure-JSON output that validates against `schema`.
    Tries Claude first; if Claude is unavailable (credit, rate limit, outage),
    falls back to Gemini automatically. Raises AIClientError only if every
    configured provider fails.
    """
    if _client is None and _gemini_model is None:
        raise AIClientError(
            "No AI provider configured. Set ANTHROPIC_API_KEY and/or GEMINI_API_KEY."
        )

    schema_hint = json.dumps(schema.model_json_schema(), indent=2)
    full_system = (
        f"{system_prompt}\n\n"
        "You must respond with ONLY valid JSON matching this JSON Schema. "
        "No prose, no markdown fences, no commentary before or after.\n\n"
        f"JSON Schema:\n{schema_hint}\n\n"
        "CRITICAL RULES:\n"
        "- Never invent clinical facts, diagnoses, procedures, or evidence that is not present "
        "in the supplied documents.\n"
        "- If information is not present, leave the field empty/null or mark evidence_found=false.\n"
        "- Every code you output must cite the exact supporting text/finding from the documents."
    )

    providers = []
    if _client is not None:
        providers.append(("claude", _call_claude))
    if _gemini_model is not None:
        providers.append(("gemini", _call_gemini))

    last_error = None
    prompt = user_prompt

    for provider_name, call_fn in providers:
        for attempt in range(3):
            try:
                raw_text = call_fn(full_system, prompt, max_tokens, temperature)
            except _PROVIDER_ERRORS as e:
                last_error = e
                break
            except Exception as e:  # noqa: BLE001
                last_error = e
                break

            cleaned = _strip_code_fences(raw_text)
            try:
                data = json.loads(cleaned)
                return schema.model_validate(data)
            except Exception as e:  # noqa: BLE001
                last_error = e
                prompt = (
                    f"{prompt}\n\nYour previous response failed to parse as valid JSON "
                    f"matching the schema ({e}). Return ONLY corrected valid JSON."
                )
        prompt = user_prompt

    raise AIClientError(f"All configured AI providers failed. Last error: {last_error}")
