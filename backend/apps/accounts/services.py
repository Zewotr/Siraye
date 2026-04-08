from uuid import uuid4

from django.conf import settings
from google.auth.transport import requests
from google.oauth2 import id_token

from apps.monitoring.models import SecurityLog


def verify_google_id_token(raw_id_token: str) -> dict:
    try:
        decoded = id_token.verify_oauth2_token(
            raw_id_token,
            requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID,
        )
    except Exception as exc:  # pragma: no cover - network token validation dependent
        raise ValueError("Invalid Google token.") from exc

    if decoded.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
        raise ValueError("Token issuer is not Google.")

    if not decoded.get("email"):
        raise ValueError("Google account email missing.")

    return decoded


def upload_profile_picture(user_id: int, uploaded_file) -> str:
    from apps.monitoring.services import upload_file_to_supabase

    path = f"profiles/{user_id}/{uuid4()}-{uploaded_file.name}"
    return upload_file_to_supabase(path=path, file_obj=uploaded_file, user_id=user_id)


def log_failed_login(ip_address: str, path: str, metadata: dict | None = None):
    SecurityLog.objects.create(
        event_type=SecurityLog.EventType.FAILED_LOGIN,
        ip_address=ip_address,
        path=path,
        method="POST",
        metadata=metadata or {},
    )
