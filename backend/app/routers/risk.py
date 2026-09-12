from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import CurrentUser, require_role
from app.supabase_client import supabase

router = APIRouter()
SupervisorOrAdmin = Depends(require_role("Supervisor", "Admin"))


def _client():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )
    return supabase


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _days_since(value: str | None) -> int:
    inspected_at = _parse_datetime(value)
    if inspected_at is None:
        return 0
    return max(0, (datetime.now(timezone.utc) - inspected_at).days)


def _load_risk_data() -> tuple[list[dict], list[dict]]:
    client = _client()
    try:
        inspections_response = (
            client.table("inspections")
            .select("id, manufacturer, product_id, category, created_at, compliance_score")
            .execute()
        )
        violations_response = (
            client.table("violations")
            .select("inspection_id, declaration_type, severity, resolved")
            .execute()
        )
        return inspections_response.data or [], violations_response.data or []
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load risk intelligence data.",
        ) from exc


def _manufacturer_metrics(inspections: list[dict], violations: list[dict]) -> list[dict]:
    inspection_by_id = {inspection.get("id"): inspection for inspection in inspections}
    grouped: dict[str, list[dict]] = defaultdict(list)
    for inspection in inspections:
        manufacturer = str(inspection.get("manufacturer") or "Unknown").strip()
        grouped[manufacturer].append(inspection)

    violations_by_manufacturer: dict[str, list[dict]] = defaultdict(list)
    for violation in violations:
        inspection = inspection_by_id.get(violation.get("inspection_id"))
        if inspection:
            manufacturer = str(inspection.get("manufacturer") or "Unknown").strip()
            violations_by_manufacturer[manufacturer].append(violation)

    metrics = []
    for manufacturer, manufacturer_inspections in grouped.items():
        manufacturer_violations = violations_by_manufacturer[manufacturer]
        declaration_counts = Counter(
            str(violation.get("declaration_type") or "Unknown")
            for violation in manufacturer_violations
        )
        repeat_violations = sum(
            count for count in declaration_counts.values() if count > 1
        )
        latest_inspection = max(
            manufacturer_inspections,
            key=lambda inspection: _parse_datetime(inspection.get("created_at"))
            or datetime.min.replace(tzinfo=timezone.utc),
        )
        days_since_last = _days_since(latest_inspection.get("created_at"))
        unresolved_violations = sum(
            1 for violation in manufacturer_violations
            if violation.get("resolved") is not True
        )

        # Hackathon heuristic, not a production risk model: repeated and
        # unresolved violations drive risk; recent inspections reduce it.
        recency_penalty = max(0, 10 - (days_since_last // 7))
        risk_score = min(
            100,
            max(
                0,
                len(manufacturer_violations) * 10
                + repeat_violations * 15
                + unresolved_violations * 5
                - recency_penalty,
            ),
        )
        metrics.append(
            {
                "manufacturer": manufacturer,
                "total_inspections": len(manufacturer_inspections),
                "total_violations": len(manufacturer_violations),
                "repeat_violations": repeat_violations,
                "unresolved_violations": unresolved_violations,
                "days_since_last_inspection": days_since_last,
                "risk_score": risk_score,
                "last_inspection_at": latest_inspection.get("created_at"),
            }
        )
    return sorted(metrics, key=lambda item: item["risk_score"], reverse=True)


@router.get("/manufacturers")
def manufacturer_risk(user: CurrentUser = SupervisorOrAdmin):
    del user
    inspections, violations = _load_risk_data()
    return {"items": _manufacturer_metrics(inspections, violations)}


@router.get("/priority-recommendations")
def priority_recommendations(
    days: int = Query(default=30, ge=1, le=3650),
    user: CurrentUser = SupervisorOrAdmin,
):
    del user
    inspections, violations = _load_risk_data()
    metrics = _manufacturer_metrics(inspections, violations)
    recommendations = []
    for metric in metrics:
        if metric["days_since_last_inspection"] < days:
            continue
        recommendations.append(
            {
                **metric,
                "reason": (
                    f"{metric['unresolved_violations']} unresolved violations, "
                    f"not inspected in {metric['days_since_last_inspection']} days"
                ),
            }
        )
        if len(recommendations) == 5:
            break
    return {"items": recommendations, "days_threshold": days}
