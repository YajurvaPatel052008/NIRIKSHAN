from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.supabase_client import supabase


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    role: str
    region: str | None = None


def _unauthorized(detail: str = "Invalid or expired authentication token.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    """Resolve the Supabase Auth user and their profile-based role.

    Supabase service-role credentials are used only for the server-side profile
    lookup and are never returned to the frontend.
    """
    if not authorization:
        raise _unauthorized("Authorization header is required.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _unauthorized("Authorization must use the Bearer scheme.")
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on this service.",
        )

    # Validate with Supabase Auth instead of decoding locally with HS256.
    # This supports projects using Supabase's newer signing keys as well as
    # legacy JWT secrets.
    try:
        auth_response = supabase.auth.get_user(token)
        auth_user = auth_response.user
    except Exception as exc:
        raise _unauthorized() from exc

    if auth_user is None or not auth_user.id:
        raise _unauthorized()
    user_id = auth_user.id

    try:
        profile_response = (
            supabase.table("profiles")
            .select("id, role, region, status")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        # Keep existing deployments usable until the status migration is run.
        try:
            profile_response = (
                supabase.table("profiles")
                .select("id, role, region")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to load the user profile.",
            ) from exc

    profile = profile_response.data
    if not profile:
        raise _unauthorized("No profile is associated with this user.")

    if (profile.get("status") or "Active").casefold() == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact your administrator.",
        )

    role = profile.get("role")
    if not isinstance(role, str) or not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have an assigned role.",
        )

    return CurrentUser(
        id=user_id,
        email=auth_user.email,
        role=role,
        region=profile.get("region"),
    )


def require_role(*allowed_roles: str) -> Callable:
    """Create an RBAC dependency for the supplied role names.

    Example:

        @router.get("/admin-only")
        def admin_route(user: CurrentUser = Depends(require_role("Admin"))):
            return {"user_id": user.id}
    """
    if not allowed_roles:
        raise ValueError("At least one allowed role is required.")

    async def role_dependency(
        user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        normalized_roles = {
            "admin" if role.casefold() == "administrator" else role.casefold()
            for role in allowed_roles
        }
        current_role = user.role.casefold()
        if current_role == "administrator":
            current_role = "admin"
        if current_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return user

    return role_dependency
