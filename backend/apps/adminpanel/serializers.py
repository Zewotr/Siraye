from rest_framework import serializers

from apps.accounts.models import User
from apps.monitoring.models import BackupRecord, SecurityLog


class AdminUserSerializer(serializers.ModelSerializer):
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "is_active",
            "is_banned",
            "email_verified",
            "created_at",
            "task_count",
        ]


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "email", "role", "is_active", "is_banned"]


class SecurityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = SecurityLog
        fields = [
            "id",
            "event_type",
            "user",
            "user_email",
            "ip_address",
            "user_agent",
            "path",
            "method",
            "metadata",
            "created_at",
        ]

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None


class BackupRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupRecord
        fields = [
            "id",
            "file_name",
            "bucket_path",
            "public_url",
            "size_bytes",
            "status",
            "error_message",
            "created_at",
        ]
