"""OpenCV image loading, quality checks, and preprocessing helpers."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Union

import cv2
import numpy as np

logger = logging.getLogger(__name__)

ImageInput = Union[str, Path, bytes, bytearray, memoryview, np.ndarray]
MIN_WIDTH = 300
MIN_HEIGHT = 300
MIN_BRIGHTNESS = 35.0
MAX_BRIGHTNESS = 220.0
MIN_BLUR_SCORE = 100.0
MAX_DIMENSION = 1600
MAX_PROCESSING_DIMENSION = 1200


def load_image(path_or_bytes: ImageInput) -> np.ndarray:
    """Load a color BGR image from a path, encoded bytes, or an image array."""
    if isinstance(path_or_bytes, np.ndarray):
        image = path_or_bytes.copy()
    elif isinstance(path_or_bytes, (str, Path)):
        image = cv2.imread(str(path_or_bytes), cv2.IMREAD_COLOR)
    elif isinstance(path_or_bytes, (bytes, bytearray, memoryview)):
        encoded = np.frombuffer(path_or_bytes, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    else:
        raise TypeError("Image input must be a path, encoded bytes, or NumPy array.")

    if image is None or image.size == 0:
        raise ValueError("Unable to decode the image.")
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    if image.ndim != 3 or image.shape[2] != 3:
        raise ValueError("Image must have three color channels.")
    return image


def check_quality(image: np.ndarray) -> dict[str, bool | float]:
    """Return deterministic resolution, lighting, blur, and overall checks."""
    image = load_image(image)
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    resolution_ok = width >= MIN_WIDTH and height >= MIN_HEIGHT
    brightness_ok = MIN_BRIGHTNESS <= brightness <= MAX_BRIGHTNESS
    blur_ok = blur_score >= MIN_BLUR_SCORE
    return {
        "resolution_ok": resolution_ok,
        "brightness_ok": brightness_ok,
        "blur_score": round(blur_score, 2),
        "blur_ok": blur_ok,
        "overall_pass": resolution_ok and brightness_ok and blur_ok,
    }


def enhance_image(image: np.ndarray) -> np.ndarray:
    """Denoise, improve local contrast, and cap the image's largest dimension."""
    image = load_image(image)
    height, width = image.shape[:2]
    largest_dimension = max(height, width)
    if largest_dimension > MAX_PROCESSING_DIMENSION:
        scale = MAX_PROCESSING_DIMENSION / largest_dimension
        image = cv2.resize(
            image,
            (max(1, round(width * scale)), max(1, round(height * scale))),
            interpolation=cv2.INTER_AREA,
        )
    denoised = cv2.fastNlMeansDenoisingColored(image, None, 5, 5, 7, 21)
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    lightness, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = cv2.cvtColor(
        cv2.merge((clahe.apply(lightness), a_channel, b_channel)),
        cv2.COLOR_LAB2BGR,
    )

    height, width = enhanced.shape[:2]
    largest_dimension = max(height, width)
    if largest_dimension > MAX_DIMENSION:
        scale = MAX_DIMENSION / largest_dimension
        enhanced = cv2.resize(
            enhanced,
            (max(1, round(width * scale)), max(1, round(height * scale))),
            interpolation=cv2.INTER_AREA,
        )
    return enhanced


def _order_points(points: np.ndarray) -> np.ndarray:
    ordered = np.zeros((4, 2), dtype=np.float32)
    sums = points.sum(axis=1)
    differences = np.diff(points, axis=1).reshape(-1)
    ordered[0] = points[np.argmin(sums)]
    ordered[2] = points[np.argmax(sums)]
    ordered[1] = points[np.argmin(differences)]
    ordered[3] = points[np.argmax(differences)]
    return ordered


def correct_perspective(image: np.ndarray) -> np.ndarray:
    """Warp the largest clear quadrilateral; return the input unchanged otherwise."""
    image = load_image(image)
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    image_area = float(height * width)
    best_quad = None
    best_area = 0.0

    for contour in contours:
        area = cv2.contourArea(contour)
        if area <= best_area or area < image_area * 0.20:
            continue
        perimeter = cv2.arcLength(contour, True)
        polygon = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(polygon) == 4 and cv2.isContourConvex(polygon):
            best_quad = polygon.reshape(4, 2).astype(np.float32)
            best_area = area

    if best_quad is None:
        logger.warning("No clear rectangular label contour found; skipping perspective correction.")
        return image

    source = _order_points(best_quad)
    top_width = np.linalg.norm(source[1] - source[0])
    bottom_width = np.linalg.norm(source[2] - source[3])
    left_height = np.linalg.norm(source[3] - source[0])
    right_height = np.linalg.norm(source[2] - source[1])
    target_width = max(1, round(max(top_width, bottom_width)))
    target_height = max(1, round(max(left_height, right_height)))
    destination = np.array(
        [[0, 0], [target_width - 1, 0], [target_width - 1, target_height - 1], [0, target_height - 1]],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(source, destination)
    return cv2.warpPerspective(image, matrix, (target_width, target_height))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Check and enhance an image with OpenCV.")
    parser.add_argument("image_path", help="Path to a sample image")
    args = parser.parse_args()
    sample = load_image(args.image_path)
    print(check_quality(sample))
    print(f"Enhanced image shape: {enhance_image(sample).shape}")
