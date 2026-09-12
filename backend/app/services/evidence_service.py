"""Evidence cropping and storage helpers for compliance violations."""

from __future__ import annotations

import logging
from uuid import uuid4

import cv2
import numpy as np

from app.supabase_client import supabase

logger = logging.getLogger(__name__)

EVIDENCE_BUCKET = "inspection-images"
EVIDENCE_PREFIX = "evidence"
DEFAULT_PADDING = 12


def crop_evidence(image: np.ndarray, bounding_box: dict) -> np.ndarray:
    """Crop a padded, clipped bounding-box region from an image."""
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("image must be a non-empty NumPy array")
    if not isinstance(bounding_box, dict):
        raise ValueError("bounding_box must be a dictionary")

    try:
        x = int(bounding_box["x"])
        y = int(bounding_box["y"])
        width = int(bounding_box["w"])
        height = int(bounding_box["h"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("bounding_box must contain integer x, y, w, and h values") from exc

    if width <= 0 or height <= 0:
        raise ValueError("bounding_box width and height must be positive")

    padding = max(DEFAULT_PADDING, round(min(width, height) * 0.1))
    image_height, image_width = image.shape[:2]
    left = max(0, x - padding)
    top = max(0, y - padding)
    right = min(image_width, x + width + padding)
    bottom = min(image_height, y + height + padding)
    if left >= right or top >= bottom:
        raise ValueError("bounding_box does not overlap the image")

    return image[top:bottom, left:right].copy()


def save_evidence_image(
    cropped_image: np.ndarray,
    inspection_id: str,
    violation_id: str,
) -> str:
    """Encode and upload an evidence crop, returning its private storage path."""
    if not isinstance(cropped_image, np.ndarray) or cropped_image.size == 0:
        raise ValueError("cropped_image must be a non-empty NumPy array")
    if not inspection_id or not violation_id:
        raise ValueError("inspection_id and violation_id are required")
    if supabase is None:
        raise RuntimeError("Supabase is not configured; cannot save evidence image")

    encoded, image_bytes = cv2.imencode(".jpg", cropped_image, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if not encoded:
        raise ValueError("Unable to encode evidence image as JPEG")

    storage_path = f"{EVIDENCE_PREFIX}/{inspection_id}/{violation_id}.jpg"
    supabase.storage.from_(EVIDENCE_BUCKET).upload(
        storage_path,
        image_bytes.tobytes(),
        {"content-type": "image/jpeg", "upsert": "true"},
    )
    return storage_path


def _matching_declaration(violation: dict, declarations: list[dict]) -> dict | None:
    declaration_type = str(violation.get("declaration_type", "")).casefold()
    if not declaration_type:
        return None
    for declaration in declarations:
        if str(declaration.get("declaration_type", "")).casefold() == declaration_type:
            return declaration
    return None


def attach_evidence_to_violations(
    violations: list[dict],
    declarations: list[dict],
    full_image: np.ndarray,
) -> list[dict]:
    """Attach stored visual evidence paths to violations with source boxes."""
    if not isinstance(violations, list) or not isinstance(declarations, list):
        raise ValueError("violations and declarations must be lists")

    attached = []
    for violation in violations:
        enriched_violation = dict(violation)
        declaration = _matching_declaration(violation, declarations)
        bounding_box = declaration.get("bounding_box") if declaration else None
        if bounding_box is None and declaration:
            bounding_box = declaration.get("source_bounding_box")

        if not isinstance(bounding_box, dict):
            enriched_violation["evidence_image_path"] = None
            attached.append(enriched_violation)
            continue

        inspection_id = violation.get("inspection_id")
        if not inspection_id:
            raise ValueError(
                "inspection_id is required on a violation before evidence can be stored"
            )
        violation_id = str(violation.get("id") or violation.get("violation_id") or uuid4())
        cropped_image = crop_evidence(full_image, bounding_box)
        enriched_violation["evidence_image_path"] = save_evidence_image(
            cropped_image,
            inspection_id,
            violation_id,
        )
        attached.append(enriched_violation)

    return attached
