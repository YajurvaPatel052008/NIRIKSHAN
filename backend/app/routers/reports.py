from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import CurrentUser, get_current_user
from app.services.report_service import generate_pdf
from app.supabase_client import supabase

router = APIRouter()


def _client():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )
    return supabase


@router.get("/ping")
def ping():
    return {"status": "ok", "router": "reports"}


@router.post("/inspections/{inspection_id}/generate-report")
def generate_inspection_report(
    inspection_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    del user
    client = _client()
    try:
        pdf_bytes = generate_pdf(inspection_id)
        storage_path = f"reports/{inspection_id}.pdf"
        client.storage.from_("inspection-images").upload(
            storage_path,
            pdf_bytes,
            {"content-type": "application/pdf", "upsert": "true"},
        )
        report_response = (
            client.table("reports")
            .insert(
                {
                    "inspection_id": inspection_id,
                    "pdf_storage_path": storage_path,
                }
            )
            .execute()
        )
        signed_url = client.storage.from_("inspection-images").create_signed_url(
            storage_path,
            3600,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to generate or store the inspection report.",
        ) from exc

    return {
        "id": report_response.data[0]["id"] if report_response.data else None,
        "storage_path": storage_path,
        "url": signed_url.get("signedURL") or signed_url.get("signed_url"),
    }


@router.get("/inspections/{inspection_id}/report")
def get_latest_inspection_report(
    inspection_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    del user
    client = _client()
    try:
        response = (
            client.table("reports")
            .select("*")
            .eq("inspection_id", inspection_id)
            .order("generated_at", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No generated report exists for this inspection.",
            )
        report = response.data[0]
        signed_url = client.storage.from_("inspection-images").create_signed_url(
            report["pdf_storage_path"],
            3600,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load the inspection report.",
        ) from exc

    return {
        "id": report.get("id"),
        "storage_path": report["pdf_storage_path"],
        "url": signed_url.get("signedURL") or signed_url.get("signed_url"),
        "generated_at": report.get("generated_at"),
    }
