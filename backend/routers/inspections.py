from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import InspectionDraft, VerificationSubmission
from services.report_service import generate_pdf

router = APIRouter()


@router.get("/")
def list_inspections():
    return {"items": []}


@router.get("/products")
def list_products():
    return {"items": []}


@router.post("/")
def create_inspection(draft: InspectionDraft):
    return {
        "id": "demo-inspection",
        "status": "draft",
        "inspection": draft.model_dump(),
    }


@router.post("/{inspection_id}/analyze")
def analyze_inspection(inspection_id: str):
    return {
        "id": inspection_id,
        "status": "processing",
        "message": "Inspection queued for OpenCV, PaddleOCR, Groq, and rule-engine analysis.",
    }


@router.get("/{inspection_id}/results")
def get_inspection_results(inspection_id: str):
    return {
        "id": inspection_id,
        "score": 72,
        "status": "MINOR VIOLATIONS",
        "summary": {
            "product_name": "Bharat Foods Premium Whole Wheat Flour",
            "category": "Food & Beverages",
            "manufacturer": "Bharat Foods Pvt. Ltd.",
            "inspection_date": "10 Sep 2026, 10:42 AM",
            "inspector": "Yajurva Patel",
            "location": "New Delhi, India",
        },
        "violations": [
            {
                "type": "Missing Declaration",
                "declaration": "Country of Origin",
                "severity": "High",
                "rule": "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6",
                "evidence": "Country-of-origin declaration region",
                "confidence": 93,
            },
            {
                "type": "Small Font Size",
                "declaration": "Consumer Care Details",
                "severity": "Medium",
                "rule": "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 9",
                "evidence": "Consumer-care text crop",
                "confidence": 87,
            },
            {
                "type": "Incorrect Format",
                "declaration": "Month & Year of Manufacture",
                "severity": "Low",
                "rule": "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6",
                "evidence": "Date declaration crop",
                "confidence": 81,
            },
        ],
        "compliant_declarations": [
            "Manufacturer / Packer / Importer name and address",
            "Net quantity declaration",
            "Maximum Retail Price (MRP)",
            "Product identity and common name",
        ],
    }


@router.patch("/{inspection_id}/verify")
def verify_inspection(inspection_id: str, submission: VerificationSubmission):
    return {
        "id": inspection_id,
        "status": "verified",
        "verified_items": len(submission.items),
        "items": [item.model_dump() for item in submission.items],
    }


@router.get("/{inspection_id}/report.pdf")
def download_report(inspection_id: str):
    pdf = generate_pdf({"id": inspection_id, "score": 72, "status": "MINOR VIOLATIONS"})
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="niriksha-{inspection_id}-report.pdf"'},
    )
