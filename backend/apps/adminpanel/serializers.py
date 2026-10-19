from rest_framework import serializers

from apps.accounts.models import User
from apps.monitoring.models import BackupRecord, SecurityLog


class AdminUserSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    has_usable_password = serializers.SerializerMethodField()
    access_level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "job_type",
            "theme_preference",
            "accent_color",
            "onboarding_completed",
            "is_active",
            "is_banned",
            "access_level",
            "created_at",
            "task_count",
            "has_usable_password",
        ]

    def get_has_usable_password(self, obj):
        return obj.has_usable_password()

    def get_task_count(self, obj):
        return getattr(obj, "task_count", obj.created_tasks.count())

    def get_access_level(self, obj):
        return "super_admin" if obj.is_superuser else "admin"


class AdminCreateSerializer(serializers.ModelSerializer):
    access_level = serializers.ChoiceField(
        choices=[("admin", "Admin"), ("super_admin", "Super Admin")],
        default="admin",
        write_only=True,
    )
    password = serializers.CharField(required=False, write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["name", "email", "password", "access_level"]

    def validate_email(self, value):
        return value.lower()

    def create(self, validated_data):
        access_level = validated_data.pop("access_level", "admin")
        password = validated_data.pop("password", None)
        user = User.objects.create_user(
            password=password or None,
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=access_level == "super_admin",
            **validated_data,
        )
        return user


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
