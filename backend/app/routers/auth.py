from fastapi import APIRouter
from fastapi import Depends

from app.auth import CurrentUser, get_current_user

router = APIRouter()


@router.get("/ping")
def ping():
    return {"status": "ok", "router": "auth"}


@router.get("/me")
def current_user(user: CurrentUser = Depends(get_current_user)):
    """Return the authenticated profile used by the frontend session."""
    return user.model_dump()
