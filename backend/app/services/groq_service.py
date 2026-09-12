"""Groq-powered semantic extraction and declaration normalization."""

from __future__ import annotations

import json
import logging
from typing import Any

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)

MODEL_NAME = "openai/gpt-oss-20b"

# PaddleOCR tells us where text is; Groq determines what each piece means and
# standardizes messy real-world formatting into values the rule engine can check.
GROQ_CLIENT = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None

DECLARATION_TYPES = (
    "Manufacturer/Packer/Importer Name & Address",
    "Net Quantity",
    "MRP",
    "Month & Year of Manufacture/Packing",
    "Consumer Care Details",
    "Country of Origin",
)

_DECLARATION_TYPE_ALIASES = {
    "manufacturer/packer/importer name & address": "Manufacturer",
    "manufacturer": "Manufacturer",
    "net quantity": "Net Quantity",
    "mrp": "MRP",
    "month & year of manufacture/packing": "Mfg Date",
    "mfg date": "Mfg Date",
    "consumer care details": "Consumer Care",
    "consumer care": "Consumer Care",
    "country of origin": "Country of Origin",
}


def _normalize_declaration_type(value: Any) -> str:
    normalized = " ".join(str(value or "").split()).casefold()
    return _DECLARATION_TYPE_ALIASES.get(normalized, str(value or "").strip())


def _build_prompt(raw_ocr_lines: list[dict], category: str) -> str:
    ocr_payload = json.dumps(raw_ocr_lines, ensure_ascii=False, indent=2)
    declaration_types = ", ".join(DECLARATION_TYPES)
    return f"""You are a Legal Metrology label compliance extraction assistant for packaged
commodities in India.

Product category: {category or "Unknown"}

The OCR output below contains detected text and its source bounding box:
{ocr_payload}

Classify each relevant piece of text into exactly one of these declaration types:
{declaration_types}

Normalize values for consistent rule checks. Examples:
- "Rs.149/-" becomes "₹149"
- "250 GM" becomes "250g"
- "MAR 2025" becomes "03/2025"

Return ONLY a strict JSON array, with no preamble and no markdown fences.
Each array item must have exactly this shape:
{{"declaration_type": "string", "extracted_value": "string",
"normalized_value": "string", "confidence": 0.0,
"source_bounding_box": {{"x": 0, "y": 0, "w": 0, "h": 0}}}}

Use a confidence number from 0 to 1. Set source_bounding_box to null only when
the declaration cannot be tied to one of the supplied OCR lines. Ignore text
that is not one of the listed declaration types."""


def _strip_code_fences(content: str) -> str:
    cleaned = content.strip()
    if cleaned.startswith("```") and cleaned.endswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].strip().lower() in {"```json", "```"}:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def classify_declarations(raw_ocr_lines: list[dict], category: str) -> list[dict]:
    """Classify OCR detections into normalized Legal Metrology declarations."""
    if not isinstance(raw_ocr_lines, list):
        raise ValueError("raw_ocr_lines must be a list")

    if GROQ_CLIENT is None:
        logger.error("Groq classification skipped because GROQ_API_KEY is not configured")
        return []

    try:
        completion = GROQ_CLIENT.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Return only valid JSON matching the requested schema. "
                        "Do not include markdown or explanatory text."
                    ),
                },
                {"role": "user", "content": _build_prompt(raw_ocr_lines, category)},
            ],
            temperature=0,
        )
        content = completion.choices[0].message.content
        if not content:
            logger.error("Groq classification returned an empty response")
            return []

        parsed: Any = json.loads(_strip_code_fences(content))
        if not isinstance(parsed, list):
            logger.error("Groq classification response was not a JSON array")
            return []
        normalized_declarations = []
        for declaration in parsed:
            if not isinstance(declaration, dict):
                continue
            normalized_declaration = dict(declaration)
            normalized_declaration["declaration_type"] = _normalize_declaration_type(
                declaration.get("declaration_type")
            )
            normalized_declarations.append(normalized_declaration)
        return normalized_declarations
    except (json.JSONDecodeError, IndexError, TypeError, ValueError) as exc:
        logger.exception("Unable to parse Groq classification response: %s", exc)
        return []
    except Exception as exc:
        logger.exception("Groq classification request failed: %s", exc)
        return []
