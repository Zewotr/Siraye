from uuid import uuid4

from django.conf import settings
from google.auth.transport import requests
from google.oauth2 import id_token

from apps.monitoring.models import SecurityLog


def verify_google_id_token(raw_id_token: str) -> dict:
    # Support development and E2E testing Google tokens
    if raw_id_token.startswith("mock-google:") or raw_id_token.startswith("test-google:"):
        parts = raw_id_token.split(":")
        email = parts[1].strip().lower() if len(parts) > 1 and parts[1].strip() else "google.user@example.com"
        name = parts[2].strip() if len(parts) > 2 and parts[2].strip() else email.split("@")[0].replace(".", " ").title()
        return {
            "iss": "https://accounts.google.com",
            "email": email,
            "name": name,
            "picture": f"https://api.dicebear.com/7.x/initials/svg?seed={name}",
        }

    client_id = (getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or "").strip()
    audience = client_id if client_id else None

    try:
        decoded = id_token.verify_oauth2_token(
            raw_id_token,
            requests.Request(),
            audience=audience,
        )
    except Exception as exc:  # pragma: no cover - network token validation dependent
        # Fallback: check Google OAuth2 userinfo endpoint (handles OAuth access tokens e.g. ya29...)
        try:
            import requests as py_requests
            userinfo_resp = py_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {raw_id_token}"},
                timeout=10,
            )
            if userinfo_resp.status_code == 200:
                userinfo = userinfo_resp.json()
                if userinfo.get("email"):
                    return {
                        "iss": "https://accounts.google.com",
                        "email": userinfo["email"].lower(),
                        "name": userinfo.get("name") or userinfo["email"].split("@")[0],
                        "picture": userinfo.get("picture", ""),
                    }
        except Exception:
            pass

        raise ValueError(f"Invalid Google token: {exc}") from exc

    if decoded.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
        raise ValueError("Token issuer is not Google.")

    if not decoded.get("email"):
        raise ValueError("Google account email missing.")

    return decoded


def upload_profile_picture(user_id: int, uploaded_file) -> str:
    from apps.monitoring.services import upload_file_to_supabase

    path = f"profiles/{user_id}/{uuid4()}-{uploaded_file.name}"
    try:
        return upload_file_to_supabase(path=path, file_obj=uploaded_file, user_id=user_id)
    except Exception:
        from django.core.files.storage import default_storage

        uploaded_file.seek(0)
        saved_path = default_storage.save(path, uploaded_file)
        return default_storage.url(saved_path)



def log_failed_login(ip_address: str, path: str, metadata: dict | None = None):
    SecurityLog.objects.create(
        event_type=SecurityLog.EventType.FAILED_LOGIN,
        ip_address=ip_address,
        path=path,
        method="POST",
        metadata=metadata or {},
    )
