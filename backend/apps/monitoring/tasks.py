import os
import subprocess
from datetime import datetime

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from apps.accounts.models import User
from apps.tasks.models import Task

from .models import BackupRecord, SystemMetric
from .services import storage_summary, upload_binary_backup


@shared_task
def collect_system_metrics():
    today = timezone.now().date()
    summary = storage_summary()

    metric = SystemMetric.objects.create(
        total_users=User.objects.count(),
        active_users=User.objects.filter(is_active=True, is_banned=False).count(),
        tasks_created=Task.objects.count(),
        tasks_completed_today=Task.objects.filter(
            status=Task.Status.COMPLETED,
            completed_at__date=today,
        ).count(),
        system_storage_usage_bytes=summary["total_storage_usage_bytes"],
        uploaded_files=summary["uploaded_files"],
    )
    return metric.id


@shared_task
def backup_database():
    file_name = f"siraye-backup-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.sql"

    env = os.environ.copy()
    env["PGPASSWORD"] = settings.DATABASES["default"]["PASSWORD"]

    dump_cmd = [
        "pg_dump",
        "-h",
        settings.DATABASES["default"]["HOST"],
        "-p",
        str(settings.DATABASES["default"]["PORT"]),
        "-U",
        settings.DATABASES["default"]["USER"],
        settings.DATABASES["default"]["NAME"],
    ]

    try:
        proc = subprocess.run(dump_cmd, capture_output=True, check=True, env=env)
        dump_bytes = proc.stdout

        bucket_path, public_url, size = upload_binary_backup(file_name=file_name, file_bytes=dump_bytes)

        record = BackupRecord.objects.create(
            file_name=file_name,
            bucket_path=bucket_path,
            public_url=public_url,
            size_bytes=size,
            status=BackupRecord.Status.SUCCESS,
        )
        return record.id
    except Exception as exc:  # pragma: no cover - requires infra
        record = BackupRecord.objects.create(
            file_name=file_name,
            status=BackupRecord.Status.FAILED,
            error_message=str(exc),
        )
        return record.id
