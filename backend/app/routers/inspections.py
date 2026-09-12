import logging
from uuid import uuid4

from datetime import date, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

from app.auth import CurrentUser, get_current_user
from app.supabase_client import supabase
from app.services import cv_service, evidence_service, groq_service, ocr_service, rule_engine

router = APIRouter()
logger = logging.getLogger(__name__)
MAX_IMAGE_SIZE = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class InspectionDraft(BaseModel):
    category: str
    manufacturer: str
    retailer_name: str
    location: str
    notes: str | None = None


class DeclarationCorrection(BaseModel):
    declaration_id: str
    corrected_value: str = Field(min_length=1)
    reason: str = Field(min_length=1)


def _require_supabase():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )
    return supabase


def _fetch_related_rows(table_name: str, inspection_id: str) -> list[dict]:
    response = (
        _require_supabase()
        .table(table_name)
        .select("*")
        .eq("inspection_id", inspection_id)
        .execute()
    )
    return response.data or []


@router.get("/ping")
def ping():
    return {"status": "ok", "router": "inspections"}


@router.post("")
def create_inspection(
    draft: InspectionDraft,
    user: CurrentUser = Depends(get_current_user),
):
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )

    try:
        response = (
            supabase.table("inspections")
            .insert(
                {
                    "inspector_id": user.id,
                    "category": draft.category,
                    "manufacturer": draft.manufacturer,
                    "retailer_name": draft.retailer_name,
                    "location": draft.location,
                    "notes": draft.notes,
                    "status": "Draft",
                }
            )
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create the inspection draft.",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The inspection draft was not returned after creation.",
        )

    return {"id": response.data[0]["id"], "status": "Draft"}


@router.post("/{inspection_id}/upload-image")
async def upload_inspection_image(
    inspection_id: str,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    del user
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )

    if (file.content_type or "") not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPG, PNG, and WEBP images are supported.",
        )

    image_bytes = await file.read(MAX_IMAGE_SIZE + 1)
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image must be 10 MB or smaller.",
        )
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image is empty.",
        )

    storage_path = f"{inspection_id}/{uuid4()}.jpg"
    try:
        supabase.storage.from_("inspection-images").upload(
            storage_path,
            image_bytes,
            {"content-type": file.content_type, "upsert": "false"},
        )
        image_response = (
            supabase.table("inspection_images")
            .insert(
                {
                    "inspection_id": inspection_id,
                    "storage_path": storage_path,
                }
            )
            .execute()
        )
        signed_url_response = supabase.storage.from_("inspection-images").create_signed_url(
            storage_path,
            3600,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to store the inspection image.",
        ) from exc

    if not image_response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The uploaded image record was not returned after creation.",
        )

    return {
        "id": image_response.data[0]["id"],
        "storage_path": storage_path,
        "url": signed_url_response.get("signedURL"),
    }


@router.get("")
def list_inspections(
    inspector_id: str | None = None,
    inspection_status: str | None = Query(default=None, alias="status"),
    compliance_status: str | None = None,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: CurrentUser = Depends(get_current_user),
):
    del user
    client = _require_supabase()
    try:
        query = client.table("inspections").select(
            "*, products(name, category)",
            count="exact",
        )
        if inspector_id:
            query = query.eq("inspector_id", inspector_id)
        if inspection_status:
            query = query.ilike("status", inspection_status)
        if compliance_status:
            query = query.ilike("compliance_status", compliance_status)
        if category:
            query = query.ilike("category", category)
        if date_from:
            query = query.gte("created_at", datetime.combine(date_from, datetime.min.time()).isoformat())
        if date_to:
            query = query.lt(
                "created_at",
                datetime.combine(date_to, datetime.max.time()).isoformat(),
            )
        if search:
            escaped_search = search.replace(",", " ")
            query = query.or_(
                f"manufacturer.ilike.%{escaped_search}%,products.name.ilike.%{escaped_search}%"
            )

        start = (page - 1) * page_size
        response = (
            query.order("created_at", desc=True)
            .range(start, start + page_size - 1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load inspections.",
        ) from exc

    response_count = getattr(response, "count", None)
    total = response_count if response_count is not None else len(response.data or [])
    return {
        "items": response.data or [],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/product/{product_id}/history")
def product_inspection_history(
    product_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    del user
    try:
        response = (
            _require_supabase()
            .table("inspections")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", desc=False)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load product inspection history.",
        ) from exc

    inspections = response.data or []
    return {
        "product_id": product_id,
        "items": inspections,
        "trend": [
            {
                "inspection_id": inspection.get("id"),
                "date": inspection.get("created_at"),
                "compliance_score": inspection.get("compliance_score"),
                "compliance_status": inspection.get("compliance_status"),
            }
            for inspection in inspections
        ],
    }


@router.get("/{inspection_id}")
def get_inspection(
    inspection_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    del user
    try:
        inspection_response = (
            _require_supabase()
            .table("inspections")
            .select("*, products(name, category)")
            .eq("id", inspection_id)
            .maybe_single()
            .execute()
        )
        inspection = inspection_response.data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load inspection details.",
        ) from exc

    if not inspection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection was not found.")

    return {
        "inspection": {
            **inspection,
            "inspector_name": _inspector_name(inspection.get("inspector_id")),
        },
        "declarations": _fetch_related_rows("extracted_declarations", inspection_id),
        "violations": _fetch_related_rows("violations", inspection_id),
        "images": _fetch_related_rows("inspection_images", inspection_id),
    }


def _inspector_name(inspector_id: str | None) -> str | None:
    if not inspector_id or supabase is None:
        return None
    profile = (
        supabase.table("profiles")
        .select("full_name")
        .eq("id", inspector_id)
        .maybe_single()
        .execute()
        .data
    )
    return profile.get("full_name") if profile else None


@router.patch("/{inspection_id}/verify")
def verify_inspection(
    inspection_id: str,
    corrections: list[DeclarationCorrection],
    user: CurrentUser = Depends(get_current_user),
):
    del user
    client = _require_supabase()
    try:
        inspection_response = (
            client.table("inspections")
            .select("id, category")
            .eq("id", inspection_id)
            .maybe_single()
            .execute()
        )
        inspection = inspection_response.data
        if not inspection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection was not found.")

        declarations = _fetch_related_rows("extracted_declarations", inspection_id)
        declaration_ids = {declaration["id"] for declaration in declarations}
        invalid_ids = [
            correction.declaration_id
            for correction in corrections
            if correction.declaration_id not in declaration_ids
        ]
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "One or more declarations do not belong to this inspection.", "ids": invalid_ids},
            )

        for correction in corrections:
            client.table("extracted_declarations").update(
                {
                    "normalized_value": correction.corrected_value,
                    "source": "human_corrected",
                }
            ).eq("id", correction.declaration_id).execute()
            for declaration in declarations:
                if declaration["id"] == correction.declaration_id:
                    declaration["normalized_value"] = correction.corrected_value
                    declaration["source"] = "human_corrected"

        compliance = rule_engine.run_compliance_check(declarations, inspection["category"])
        client.table("violations").delete().eq("inspection_id", inspection_id).execute()
        violation_rows = [
            {
                "inspection_id": inspection_id,
                "rule_id": violation.get("rule_id"),
                "declaration_type": violation.get("declaration_type", ""),
                "severity": violation.get("severity", "Medium"),
                "description": violation.get("description", ""),
                "confidence_score": min(
                    100,
                    (
                        violation.get("confidence_score", 1) or 1
                    )
                    * 100,
                ),
            }
            for violation in compliance["violations"]
        ]
        stored_violations = []
        if violation_rows:
            stored_violations = (
                client.table("violations").insert(violation_rows).execute().data or []
            )
        client.table("inspections").update(
            {
                "status": "Verified",
                "compliance_score": compliance["compliance_score"],
                "compliance_status": compliance["compliance_status"],
            }
        ).eq("id", inspection_id).execute()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify the inspection.",
        ) from exc

    return {
        "inspection_id": inspection_id,
        "declarations": declarations,
        "violations": stored_violations,
        "compliance_score": compliance["compliance_score"],
        "compliance_status": compliance["compliance_status"],
    }


def _update_inspection_status(inspection_id: str, status_value: str, **fields) -> None:
    if supabase is None:
        return
    try:
        supabase.table("inspections").update(
            {"status": status_value, **fields}
        ).eq("id", inspection_id).execute()
    except Exception:
        if status_value != "Failed":
            raise
        # Existing deployments may use the original schema, which did not
        # include Failed in its status constraint. Preserve the error details
        # in notes while keeping the row valid until the migration is applied.
        supabase.table("inspections").update(
            {"status": "Draft", **fields}
        ).eq("id", inspection_id).execute()


@router.post("/{inspection_id}/analyze")
def analyze_inspection(
    inspection_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    del user
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )

    processing_started = False
    current_stage = "loading inspection"
    try:
        current_stage = "loading inspection"
        inspection_response = (
            supabase.table("inspections")
            .select("*")
            .eq("id", inspection_id)
            .maybe_single()
            .execute()
        )
        inspection = inspection_response.data
        if not inspection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inspection was not found.",
            )

        image_response = (
            supabase.table("inspection_images")
            .select("*")
            .eq("inspection_id", inspection_id)
            .order("uploaded_at", desc=True)
            .limit(1)
            .execute()
        )
        if not image_response.data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Upload an inspection image before analysis.",
            )
        inspection_image = image_response.data[0]

        current_stage = "downloading inspection image"
        image_bytes = supabase.storage.from_("inspection-images").download(
            inspection_image["storage_path"]
        )
        current_stage = "checking image quality"
        image = cv_service.load_image(image_bytes)
        quality = cv_service.check_quality(image)
        if not quality["overall_pass"]:
            _update_inspection_status(
                inspection_id,
                "Failed",
                notes=f"Image quality check failed: {quality}",
            )
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": "Image quality is insufficient. Retake the photo.",
                    "quality": quality,
                },
            )

        _update_inspection_status(inspection_id, "Processing")
        processing_started = True
        current_stage = "enhancing image"
        processed_image = cv_service.correct_perspective(
            cv_service.enhance_image(image)
        )
        current_stage = "extracting text with PaddleOCR"
        raw_ocr_lines = ocr_service.extract_text(processed_image)
        if not raw_ocr_lines:
            _update_inspection_status(
                inspection_id,
                "Failed",
                notes="OCR did not detect readable text in the uploaded image.",
            )
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No readable label text was detected. Retake the photo with the label closer and in focus.",
            )
        current_stage = "classifying declarations with Groq"
        declarations = groq_service.classify_declarations(
            raw_ocr_lines,
            inspection["category"],
        )

        current_stage = "saving declarations"
        supabase.table("extracted_declarations").delete().eq(
            "inspection_id", inspection_id
        ).execute()
        supabase.table("violations").delete().eq(
            "inspection_id", inspection_id
        ).execute()

        declaration_rows = []
        for declaration in declarations:
            confidence = declaration.get("confidence")
            if isinstance(confidence, (int, float)) and confidence <= 1:
                confidence *= 100
            declaration_rows.append(
                {
                    "inspection_id": inspection_id,
                    "declaration_type": declaration.get("declaration_type", ""),
                    "extracted_value": declaration.get("extracted_value"),
                    "normalized_value": declaration.get("normalized_value"),
                    "confidence_score": confidence,
                    "bounding_box": declaration.get("source_bounding_box") or {},
                }
            )

        if declaration_rows:
            inserted_declarations = (
                supabase.table("extracted_declarations")
                .insert(declaration_rows)
                .execute()
            )
            persisted_declarations = inserted_declarations.data or declaration_rows
        else:
            persisted_declarations = []

        current_stage = "running compliance rules"
        compliance = rule_engine.run_compliance_check(
            declarations,
            inspection["category"],
        )
        violations = [
            {
                **violation,
                "inspection_id": inspection_id,
            }
            for violation in compliance["violations"]
        ]

        violation_rows = [
            {
                "inspection_id": inspection_id,
                "rule_id": violation.get("rule_id"),
                "declaration_type": violation.get("declaration_type", ""),
                "severity": violation.get("severity", "Medium"),
                "description": violation.get("description", ""),
                "confidence_score": (
                    violation.get("confidence_score", 1) * 100
                    if violation.get("confidence_score", 1) <= 1
                    else violation.get("confidence_score")
                ),
            }
            for violation in violations
        ]
        current_stage = "saving violations"
        if violation_rows:
            inserted_violations = (
                supabase.table("violations")
                .insert(violation_rows)
                .execute()
            )
            stored_violations = inserted_violations.data or violation_rows
        else:
            stored_violations = []

        current_stage = "attaching evidence"
        evidence_violations = evidence_service.attach_evidence_to_violations(
            stored_violations,
            persisted_declarations,
            processed_image,
        )
        for violation in evidence_violations:
            if violation.get("evidence_image_path") and violation.get("id"):
                (
                    supabase.table("violations")
                    .update({"evidence_image_path": violation["evidence_image_path"]})
                    .eq("id", violation["id"])
                    .execute()
                )

        current_stage = "finalizing inspection"
        _update_inspection_status(
            inspection_id,
            "Completed",
            compliance_score=compliance["compliance_score"],
            compliance_status=compliance["compliance_status"],
        )
        return {
            "declarations": declarations,
            "violations": evidence_violations,
            "compliance_score": compliance["compliance_score"],
            "compliance_status": compliance["compliance_status"],
        }
    except HTTPException:
        if processing_started:
            try:
                _update_inspection_status(
                    inspection_id,
                    "Failed",
                    notes="Analysis failed before completion.",
                )
            except Exception:
                pass
        raise
    except Exception as exc:
        logger.exception("Inspection analysis failed for %s", inspection_id)
        try:
            _update_inspection_status(
                inspection_id,
                "Failed",
                notes=f"Analysis failed during {current_stage}: {exc}",
            )
        except Exception:
            # Preserve the original pipeline error if the status update also fails.
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inspection analysis failed during {current_stage}.",
        ) from exc
