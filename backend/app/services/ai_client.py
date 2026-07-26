"""
Thin wrapper around the Anthropic API (OpenAI-compatible providers also
supported via base_url override) that always requests strict JSON output
matching a given Pydantic schema. Every agent goes through this single
choke point so prompting conventions, retries, and JSON-parsing stay
consistent across the whole pipeline.
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


class AIClientError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    return text


async def generate_structured(
    system_prompt: str,
    user_prompt: str,
    schema: Type[T],
    max_tokens: int = 4096,
    temperature: float = 0.0,
) -> T:
    """
    Calls the model, forcing pure-JSON output that validates against `schema`.
    Raises AIClientError on repeated failure so the caller/agent can mark the
    step as needing manual review rather than silently fabricating data.
    """
    if _client is None:
        raise AIClientError(
            "No ANTHROPIC_API_KEY configured. Set it in backend/.env before running agents."
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

    last_error = None
    for attempt in range(3):
        response = _client.messages.create(
            model=_settings.ai_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=full_system,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw_text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        cleaned = _strip_code_fences(raw_text)
        try:
            data = json.loads(cleaned)
            return schema.model_validate(data)
        except Exception as e:  # noqa: BLE001
            last_error = e
            user_prompt = (
                f"{user_prompt}\n\nYour previous response failed to parse as valid JSON "
                f"matching the schema ({e}). Return ONLY corrected valid JSON."
            )
    raise AIClientError(f"Failed to get valid structured output after 3 attempts: {last_error}")
