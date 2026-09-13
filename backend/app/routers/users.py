import secrets
import logging
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import CurrentUser, require_role
from app.supabase_client import supabase

router = APIRouter()
logger = logging.getLogger(__name__)
AdminUser = Depends(require_role("Admin"))


class UserCreate(BaseModel):
    email: str
    full_name: str = Field(min_length=1)
    role: Literal["Inspector", "Supervisor", "Admin"] = "Inspector"
    region: str | None = None
    temporary_password: str | None = Field(default=None, min_length=8)


class UserUpdate(BaseModel):
    role: Literal["Inspector", "Supervisor", "Admin"] | None = None
    region: str | None = None
    status: Literal["Active", "Inactive"] | None = None


def _client():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )
    return supabase


def _auth_user_value(user: Any, field: str):
    if isinstance(user, dict):
        return user.get(field)
    return getattr(user, field, None)


@router.get("/ping")
def ping():
    return {"status": "ok", "router": "users"}


@router.get("")
def list_users(user: CurrentUser = AdminUser):
    del user
    client = _client()
    try:
        response = client.table("profiles").select("*").order("created_at").execute()
        profiles = response.data or []
        try:
            auth_response = client.auth.admin.list_users()
            auth_users = _auth_user_value(auth_response, "users") or []
            last_sign_ins = {
                _auth_user_value(auth_user, "id"): _auth_user_value(auth_user, "last_sign_in_at")
                for auth_user in auth_users
            }
            for profile in profiles:
                profile["last_login"] = last_sign_ins.get(profile.get("id"))
        except Exception:
            # Profile management remains available when Auth Admin listing is unavailable.
            pass
        return {"items": profiles}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unable to load users from profiles")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load users from the profiles table.",
        ) from exc


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(user_input: UserCreate, admin: CurrentUser = AdminUser):
    client = _client()
    temporary_password = user_input.temporary_password or secrets.token_urlsafe(12)
    auth_user = None
    try:
        auth_response = client.auth.admin.create_user(
            {
                "email": user_input.email,
                "password": temporary_password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user_input.full_name,
                    "role": user_input.role,
                },
            }
        )
        auth_user = _auth_user_value(auth_response, "user")
        auth_user_id = _auth_user_value(auth_user, "id")
        if not auth_user_id:
            raise RuntimeError("Supabase Auth did not return the created user id.")

        profile_response = (
            client.table("profiles")
            .insert(
                {
                    "id": auth_user_id,
                    "full_name": user_input.full_name,
                    "role": user_input.role,
                    "region": user_input.region,
                    "status": "Active",
                }
            )
            .execute()
        )
        if not profile_response.data:
            raise RuntimeError("The profile was not returned after creation.")
    except HTTPException:
        raise
    except Exception as exc:
        if auth_user is not None:
            try:
                client.auth.admin.delete_user(_auth_user_value(auth_user, "id"))
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create the user and profile.",
        ) from exc

    return {
        "user": profile_response.data[0],
        "temporary_password": temporary_password,
    }


@router.patch("/{user_id}")
def update_user(
    user_id: str,
    changes: UserUpdate,
    user: CurrentUser = AdminUser,
):
    del user
    updates = changes.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one user field must be provided.",
        )
    try:
        response = (
            _client()
            .table("profiles")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User was not found.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to update user.",
        ) from exc


@router.patch("/{user_id}/deactivate")
def deactivate_user(user_id: str, user: CurrentUser = AdminUser):
    del user
    client = _client()
    try:
        profile_response = (
            client.table("profiles")
            .update({"status": "Inactive"})
            .eq("id", user_id)
            .execute()
        )
        if not profile_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User was not found.")

        auth_disabled = False
        try:
            client.auth.admin.update_user_by_id(user_id, {"ban_duration": "876000h"})
            auth_disabled = True
        except Exception:
            # Profile deactivation is authoritative even when Auth Admin banning is unavailable.
            pass
        return {"user": profile_response.data[0], "auth_disabled": auth_disabled}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to deactivate user.",
        ) from exc
