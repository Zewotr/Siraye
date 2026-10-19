from django.conf import settings
from django.db import models


class SecurityLog(models.Model):
    class EventType(models.TextChoices):
        FAILED_LOGIN = "failed_login", "Failed Login"
        RATE_LIMIT = "rate_limit", "Rate Limit Exceeded"
        UNAUTHORIZED = "unauthorized", "Unauthorized Access"
        FORBIDDEN = "forbidden", "Forbidden Access"
        SUSPICIOUS = "suspicious", "Suspicious Activity"
        ONBOARDING = "onboarding", "Onboarding Completed"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="security_logs",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    path = models.CharField(max_length=255, blank=True)
    method = models.CharField(max_length=10, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]


class AdminLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="admin_logs",
        on_delete=models.SET_NULL,
        null=True,
    )
    action = models.CharField(max_length=100)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="targeted_admin_logs",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["created_at"])]


class SystemMetric(models.Model):
    id = models.BigAutoField(primary_key=True)
    captured_at = models.DateTimeField(auto_now_add=True)
    total_users = models.PositiveIntegerField(default=0)
    active_users = models.PositiveIntegerField(default=0)
    tasks_created = models.PositiveIntegerField(default=0)
    tasks_completed_today = models.PositiveIntegerField(default=0)
    system_storage_usage_bytes = models.BigIntegerField(default=0)
    uploaded_files = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-captured_at"]


class FileAsset(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="file_assets",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    bucket = models.CharField(max_length=100)
    path = models.CharField(max_length=500)
    public_url = models.URLField(max_length=1000)
    size_bytes = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["bucket"]),
        ]


class BackupRecord(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    id = models.BigAutoField(primary_key=True)
    file_name = models.CharField(max_length=255)
    bucket_path = models.CharField(max_length=500, blank=True)
    public_url = models.URLField(max_length=1000, blank=True)
    size_bytes = models.BigIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
