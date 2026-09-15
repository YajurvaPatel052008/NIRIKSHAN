"""Groq-powered semantic extraction and declaration normalization."""

from __future__ import annotations

import json
import logging
from typing import Any

from groq import Groq

from app.config import settings
from app.services.declaration_terms import DECLARATION_TERMS

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
    ocr_payload = json.dumps(raw_ocr_lines, ensure_ascii=False, separators=(",", ":"))
    declaration_types = ", ".join(DECLARATION_TYPES)
    terminology = json.dumps(DECLARATION_TERMS, ensure_ascii=False, separators=(",", ":"))
    return f"""You are a Legal Metrology label compliance extraction assistant for packaged
commodities in India.

Product category: {category or "Unknown"}

The OCR output below contains detected text and its source bounding box:
{ocr_payload}

Classify each relevant piece of text into exactly one of these declaration types:
{declaration_types}

Use this maintained terminology reference to map alternate label phrasings to the
canonical declaration type. This reference is expanded from real labels over time:
{terminology}

Normalization rules:
- The normalized_value for MRP must ALWAYS begin with the ₹ symbol, regardless
  of whether ₹ was visible in OCR. If a numeric price has no currency symbol,
  prefix it with ₹ because MRP on Indian packaged goods is always in rupees.
  For example, raw OCR "10.00" or "Rs 10.00" becomes normalized_value "₹10.00".
- Strip "/-" from MRP values: "₹2499.00/-" becomes "₹2499.00".
- Convert a full month and year such as "June 2026" to "06/2026".
- For combined manufacturer, packer, importer, or marketer headings, capture
  the complete address block as the value.
- Keep country codes such as "PRC" as-is unless an obvious full-name mapping exists.
- Consumer Care Details must include phone numbers and/or email addresses under the heading.
- Preserve useful units while normalizing spacing, such as "250 GM" to "250g".

Few-shot example:
Input label fields:
"Qty: 1 Unit", "Maximum retail price per unit (Inclusive of all taxes): ₹2499.00/-",
"Month & Year of Manufacturing: June 2026",
"Imported, Marketed & Packed by: Hammer Lifestyle, SCO 4, Sector-25, Behind Malik, Petrol Pump, G.T Road, Panipat-132103 INDIA",
"Country of origin: PRC",
"For Customer Support: PH 0180-4008081, 9991108081, Email: info@hammeronline.in"
Expected mappings:
- Net Quantity -> "1 Unit"
- MRP -> "₹2499.00"
- Month & Year of Manufacture/Packing -> "06/2026"
- Manufacturer/Packer/Importer Name & Address -> "Hammer Lifestyle, SCO 4, Sector-25, Behind Malik, Petrol Pump, G.T Road, Panipat-132103 INDIA"
- Country of Origin -> "PRC"
- Consumer Care Details -> "PH 0180-4008081, 9991108081, Email: info@hammeronline.in"

Ignore non-mandatory fields such as Brand Name, Model Name, Color, and Warranty.
Do not force them into a declaration type or invent a new type; skip them.

Return ONLY a strict JSON array, with no preamble and no markdown fences.
Each found declaration must be one compact object with these keys:
{{"declaration_type":"string","extracted_value":"string",
"normalized_value":"string","confidence":0.0,
"source_bounding_box":{{"x":0,"y":0,"w":0,"h":0}}}}

Use a confidence number from 0 to 1. Set source_bounding_box to null only when
the declaration cannot be tied to one of the supplied OCR lines. Include only
declarations actually found in the OCR text; do not emit placeholder objects for
missing declaration types. Ignore text that is not one of the listed declaration types."""


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
            max_tokens=4096,
        )
        content = completion.choices[0].message.content
        if not content:
            logger.error("Groq classification returned an empty response")
            return []

        cleaned_content = _strip_code_fences(content)
        logger.info(
            "Groq classification response length=%d trailing_100=%r",
            len(cleaned_content),
            cleaned_content[-100:],
        )
        try:
            parsed: Any = json.loads(cleaned_content)
        except json.JSONDecodeError:
            parsed = None
        response_count = len(parsed) if isinstance(parsed, list) else 0
        logger.info("Groq classification returned %d declarations", response_count)
        if parsed is None:
            raise json.JSONDecodeError("Invalid Groq JSON", cleaned_content, 0)
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
    except json.JSONDecodeError as exc:
        logger.error(
            "Unable to parse Groq classification response: %s; raw response first_500=%r last_500=%r",
            exc,
            content[:500] if isinstance(content, str) else content,
            content[-500:] if isinstance(content, str) else content,
        )
        return []
    except (IndexError, TypeError, ValueError) as exc:
        logger.exception("Unable to process Groq classification response: %s", exc)
        return []
    except Exception as exc:
        logger.exception("Groq classification request failed: %s", exc)
        return []
