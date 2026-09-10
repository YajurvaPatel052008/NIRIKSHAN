from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str


class InspectionDraft(BaseModel):
    product_name: Optional[str] = None
    product_category: str
    manufacturer_name: Optional[str] = None
    retailer_name: str
    location: str
    inspection_datetime: str
    notes: Optional[str] = None


class VerificationItem(BaseModel):
    item_id: str
    action: str
    corrected_value: Optional[str] = None
    reason: Optional[str] = None


class VerificationSubmission(BaseModel):
    items: list[VerificationItem]
