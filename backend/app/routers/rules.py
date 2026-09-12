from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import CurrentUser, require_role
from app.supabase_client import supabase

router = APIRouter()
AdminUser = Depends(require_role("Admin"))


class RuleInput(BaseModel):
    rule_name: str = Field(min_length=1)
    declaration_type: str = Field(min_length=1)
    applicable_category: str = Field(default="All", min_length=1)
    validation_type: Literal[
        "Presence Check",
        "Format Check",
        "Value Range",
        "Font Size Threshold",
    ]
    threshold_value: dict[str, Any] = Field(default_factory=dict)
    severity: Literal["High", "Medium", "Low"]
    legal_reference: str = Field(min_length=1)


def _client():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )
    return supabase


def _rule_snapshot(rule: dict) -> dict:
    fields = (
        "rule_name",
        "declaration_type",
        "applicable_category",
        "validation_type",
        "threshold_value",
        "severity",
        "legal_reference",
        "is_active",
        "version",
    )
    return {field: rule.get(field) for field in fields}


def _load_rule(rule_id: str) -> dict:
    response = (
        _client()
        .table("rules")
        .select("*")
        .eq("id", rule_id)
        .maybe_single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule was not found.")
    return response.data


@router.get("/ping")
def ping():
    return {"status": "ok", "router": "rules"}


@router.get("")
def list_rules(user: CurrentUser = AdminUser):
    del user
    try:
        response = _client().table("rules").select("*").order("version", desc=True).execute()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load rules.",
        ) from exc
    return {"items": response.data or []}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_rule(rule: RuleInput, user: CurrentUser = AdminUser):
    client = _client()
    rule_data = rule.model_dump()
    rule_data.update({"version": 1, "is_active": True, "created_by": user.id})
    try:
        response = client.table("rules").insert(rule_data).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The rule was not returned after creation.",
            )
        created_rule = response.data[0]
        client.table("rule_versions").insert(
            {
                "rule_id": created_rule["id"],
                "version": 1,
                "snapshot": _rule_snapshot(created_rule),
                "changed_by": user.id,
            }
        ).execute()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create rule.",
        ) from exc
    return created_rule


@router.patch("/{rule_id}")
def update_rule(rule_id: str, changes: RuleInput, user: CurrentUser = AdminUser):
    client = _client()
    try:
        current_rule = _load_rule(rule_id)
        next_version = int(current_rule.get("version", 1)) + 1
        current_snapshot = _rule_snapshot(current_rule)
        current_snapshot["version"] = next_version
        client.table("rule_versions").insert(
            {
                "rule_id": rule_id,
                "version": next_version,
                "snapshot": current_snapshot,
                "changed_by": user.id,
            }
        ).execute()
        updated = (
            client.table("rules")
            .update({**changes.model_dump(), "version": next_version})
            .eq("id", rule_id)
            .execute()
        )
        if not updated.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The rule was not returned after update.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to update rule.",
        ) from exc
    return updated.data[0]


@router.patch("/{rule_id}/toggle-active")
def toggle_rule_active(rule_id: str, user: CurrentUser = AdminUser):
    client = _client()
    try:
        current_rule = _load_rule(rule_id)
        response = (
            client.table("rules")
            .update({"is_active": not bool(current_rule.get("is_active", False))})
            .eq("id", rule_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The rule was not returned after toggling.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to toggle rule status.",
        ) from exc
    return response.data[0]


@router.get("/{rule_id}/history")
def get_rule_history(rule_id: str, user: CurrentUser = AdminUser):
    del user
    try:
        _load_rule(rule_id)
        response = (
            _client()
            .table("rule_versions")
            .select("*")
            .eq("rule_id", rule_id)
            .order("version", desc=False)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load rule history.",
        ) from exc
    return {"rule_id": rule_id, "items": response.data or []}
