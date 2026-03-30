from uuid import uuid4

from django.conf import settings
from supabase import Client, create_client

from .models import FileAsset


def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase credentials are not configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def upload_file_to_supabase(path: str, file_obj, bucket: str | None = None, user_id: int | None = None) -> str:
    bucket_name = bucket or settings.SUPABASE_STORAGE_BUCKET
    client = get_supabase_client()
    file_bytes = file_obj.read()

    client.storage.from_(bucket_name).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": getattr(file_obj, "content_type", "application/octet-stream")},
    )

    public_url = client.storage.from_(bucket_name).get_public_url(path)
    FileAsset.objects.create(
        user_id=user_id,
        bucket=bucket_name,
        path=path,
        public_url=public_url,
        size_bytes=len(file_bytes),
    )
    return public_url


def upload_binary_backup(file_name: str, file_bytes: bytes) -> tuple[str, str, int]:
    client = get_supabase_client()
    bucket_name = settings.SUPABASE_BACKUP_BUCKET
    bucket_path = f"database/{uuid4()}-{file_name}"

    client.storage.from_(bucket_name).upload(
        path=bucket_path,
        file=file_bytes,
        file_options={"content-type": "application/sql"},
    )
    public_url = client.storage.from_(bucket_name).create_signed_url(bucket_path, 3600).get("signedURL", "")
    return bucket_path, public_url, len(file_bytes)


def storage_summary() -> dict:
    assets = FileAsset.objects.all()
    total_usage = sum(asset.size_bytes for asset in assets)

    per_user = {}
    for asset in assets.select_related("user"):
        key = asset.user.email if asset.user else "system"
        per_user[key] = per_user.get(key, 0) + asset.size_bytes

    return {
        "total_storage_usage_bytes": total_usage,
        "storage_per_user": per_user,
        "uploaded_files": assets.count(),
    }
