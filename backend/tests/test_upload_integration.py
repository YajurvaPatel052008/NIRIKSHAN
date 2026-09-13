"""Production smoke test for inspection image storage.

Run explicitly with:
  TEST_API_URL=... TEST_AUTH_TOKEN=... TEST_INSPECTION_ID=... pytest -q

The test is skipped when production credentials are not supplied.
"""

from __future__ import annotations

import os
import base64

import pytest

httpx = pytest.importorskip("httpx")
from app.supabase_client import supabase


def test_upload_image_persists_storage_object_and_database_row():
    api_url = os.getenv("TEST_API_URL")
    token = os.getenv("TEST_AUTH_TOKEN")
    inspection_id = os.getenv("TEST_INSPECTION_ID")
    if not api_url or not token or not inspection_id or supabase is None:
        pytest.skip("Set TEST_API_URL, TEST_AUTH_TOKEN, and TEST_INSPECTION_ID for the live upload test.")

    image_bytes = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
        "+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    response = httpx.post(
        f"{api_url.rstrip('/')}/inspections/{inspection_id}/upload-image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.png", image_bytes, "image/png")},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    storage_path = payload["storage_path"]

    try:
        stored = supabase.storage.from_("inspection-images").download(storage_path)
        assert stored == image_bytes
        rows = (
            supabase.table("inspection_images")
            .select("id, inspection_id, storage_path")
            .eq("inspection_id", inspection_id)
            .eq("storage_path", storage_path)
            .execute()
            .data
            or []
        )
        assert rows and rows[0]["storage_path"] == storage_path
    finally:
        supabase.storage.from_("inspection-images").remove([storage_path])
        supabase.table("inspection_images").delete().eq("storage_path", storage_path).execute()
