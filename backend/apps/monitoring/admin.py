from django.contrib import admin

from .models import AdminLog, BackupRecord, FileAsset, SecurityLog, SystemMetric


@admin.register(SecurityLog)
class SecurityLogAdmin(admin.ModelAdmin):
    list_display = ["id", "event_type", "user", "ip_address", "path", "created_at"]
    list_filter = ["event_type", "created_at"]
    search_fields = ["user__email", "ip_address", "path"]


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display = ["id", "admin", "action", "target_user", "created_at"]
    search_fields = ["admin__email", "target_user__email", "action"]


@admin.register(SystemMetric)
class SystemMetricAdmin(admin.ModelAdmin):
    list_display = [
        "captured_at",
        "total_users",
        "active_users",
        "tasks_created",
        "tasks_completed_today",
        "system_storage_usage_bytes",
    ]


@admin.register(FileAsset)
class FileAssetAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "bucket", "path", "size_bytes", "created_at"]
    search_fields = ["user__email", "bucket", "path"]


@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "file_name", "status", "size_bytes", "created_at"]
    list_filter = ["status"]
