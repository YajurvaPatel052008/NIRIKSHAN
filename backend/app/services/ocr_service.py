"""PaddleOCR text extraction helpers."""

from __future__ import annotations

import logging
import json
from pathlib import Path
from typing import Any

import numpy as np
from paddleocr import PaddleOCR

logger = logging.getLogger(__name__)

# PaddleOCR model files are downloaded on first run and cached. On Render's
# free tier this can add cold-start latency; consider pre-warming with a blank
# image during FastAPI startup via an `@app.on_event("startup")` handler.
try:
    OCR_ENGINE = PaddleOCR(use_angle_cls=True, lang="en")
except (TypeError, ValueError):
    # PaddleOCR 3.x removed some 2.x constructor options.
    OCR_ENGINE = PaddleOCR(lang="en")


def _as_array(value: Any) -> np.ndarray | None:
    try:
        array = np.asarray(value, dtype=np.float32)
    except (TypeError, ValueError):
        return None
    return array if array.size else None


def _box_from_polygon(polygon: Any) -> dict[str, int] | None:
    points = _as_array(polygon)
    if points is None or points.ndim != 2 or points.shape[1] < 2:
        return None
    x_values = points[:, 0]
    y_values = points[:, 1]
    left = int(np.floor(x_values.min()))
    top = int(np.floor(y_values.min()))
    right = int(np.ceil(x_values.max()))
    bottom = int(np.ceil(y_values.max()))
    return {
        "x": max(0, left),
        "y": max(0, top),
        "w": max(0, right - left),
        "h": max(0, bottom - top),
    }


def _read_v2_result(raw_result: Any) -> list[dict]:
    """Read PaddleOCR 2.x output: [[[polygon], [text, confidence]], ...]."""
    detections = []
    for line in raw_result or []:
        if not isinstance(line, (list, tuple)) or len(line) < 2:
            continue
        box = _box_from_polygon(line[0])
        text_data = line[1]
        if box is None or not isinstance(text_data, (list, tuple)) or len(text_data) < 2:
            continue
        text, confidence = text_data[0], text_data[1]
        detections.append({"text": str(text), "confidence": float(confidence), "bounding_box": box})
    return detections


def _read_v3_result(raw_result: Any) -> list[dict]:
    """Read PaddleOCR 3.x result objects or dictionaries."""
    data = raw_result.json if hasattr(raw_result, "json") else raw_result
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return []
    if isinstance(data, list):
        if len(data) == 1:
            data = data[0]
        else:
            detections = []
            for item in data:
                detections.extend(_read_v3_result(item))
            return detections
    if not isinstance(data, dict):
        return []

    texts = data.get("rec_texts", [])
    scores = data.get("rec_scores", [])
    polygons = data.get("rec_polys", data.get("dt_polys", []))
    detections = []
    for text, confidence, polygon in zip(texts, scores, polygons):
        box = _box_from_polygon(polygon)
        if box is not None:
            detections.append({
                "text": str(text),
                "confidence": float(confidence),
                "bounding_box": box,
            })
    return detections


def extract_text(image: np.ndarray) -> list[dict]:
    """Run PaddleOCR and return normalized text, confidence, and box records."""
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("image must be a non-empty NumPy array")

    try:
        if hasattr(OCR_ENGINE, "predict"):
            detections = []
            for result in OCR_ENGINE.predict(image) or []:
                detections.extend(_read_v3_result(result))
            return detections

        raw_results = OCR_ENGINE.ocr(image, cls=True)
        if not raw_results:
            return []
        return _read_v2_result(raw_results[0] if len(raw_results) == 1 else raw_results)
    except (RuntimeError, TypeError, ValueError, AttributeError) as exc:
        logger.exception("PaddleOCR failed to process image: %s", exc)
        return []


def extract_full_text(image: np.ndarray) -> str:
    """Join detected OCR lines into one string for semantic analysis."""
    return "\n".join(item["text"] for item in extract_text(image) if item["text"].strip())


if __name__ == "__main__":
    import argparse
    import cv2

    parser = argparse.ArgumentParser(description="Extract text from an image with PaddleOCR.")
    parser.add_argument("image_path", type=Path)
    args = parser.parse_args()
    sample = cv2.imread(str(args.image_path), cv2.IMREAD_COLOR)
    if sample is None:
        raise SystemExit(f"Unable to load image: {args.image_path}")
    results = extract_text(sample)
    print(results)
    print(extract_full_text(sample))
