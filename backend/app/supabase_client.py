from supabase import Client, create_client

from app.config import settings


supabase: Client | None = (
    create_client(settings.supabase_url, settings.supabase_service_role_key)
    if settings.supabase_url and settings.supabase_service_role_key
    else None
)
