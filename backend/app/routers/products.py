"""Product repository endpoints."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import CurrentUser, get_current_user
from app.supabase_client import supabase

router = APIRouter()


def _client():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )
    return supabase


@router.get("")
def list_products(
    search: str | None = None,
    category: str | None = None,
    compliance_status: str | None = None,
    manufacturer: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    user: CurrentUser = Depends(get_current_user),
):
    del user
    client = _client()
    try:
        products_response = client.table("products").select(
            "id, name, manufacturer, category, created_at"
        ).execute()
        inspections_query = client.table("inspections").select(
            "id, product_id, created_at, compliance_status"
        )
        if date_from:
            inspections_query = inspections_query.gte(
                "created_at",
                datetime.combine(date_from, time.min).isoformat(),
            )
        if date_to:
            inspections_query = inspections_query.lt(
                "created_at",
                datetime.combine(date_to, time.max).isoformat(),
            )
        inspections_response = inspections_query.order("created_at", desc=True).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load the product repository.",
        ) from exc

    products = products_response.data or []
    inspections = inspections_response.data or []
    inspections_by_product: dict[str, list[dict]] = {}
    for inspection in inspections:
        product_id = inspection.get("product_id")
        if product_id:
            inspections_by_product.setdefault(product_id, []).append(inspection)

    search_term = search.casefold().strip() if search else ""
    items = []
    for product in products:
        product_inspections = inspections_by_product.get(product["id"], [])
        latest = product_inspections[0] if product_inspections else None
        searchable = " ".join(
            [
                str(product.get("name") or ""),
                str(product.get("manufacturer") or ""),
                " ".join(str(item.get("id") or "") for item in product_inspections),
            ]
        ).casefold()
        if search_term and search_term not in searchable:
            continue
        if category and product.get("category", "").casefold() != category.casefold():
            continue
        if manufacturer and product.get("manufacturer", "").casefold() != manufacturer.casefold():
            continue
        if (
            compliance_status
            and (not latest or (latest.get("compliance_status") or "").casefold() != compliance_status.casefold())
        ):
            continue
        items.append(
            {
                "id": product["id"],
                "name": product["name"],
                "manufacturer": product["manufacturer"],
                "category": product["category"],
                "last_inspected": latest.get("created_at") if latest else None,
                "compliance_status": latest.get("compliance_status") if latest else None,
                "inspection_count": len(product_inspections),
            }
        )

    items.sort(key=lambda item: item["last_inspected"] or "", reverse=True)
    return {"items": items, "total": len(items)}
