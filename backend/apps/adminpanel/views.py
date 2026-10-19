from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.common.permissions import IsAdminRole
from apps.monitoring.models import AdminLog, BackupRecord, SecurityLog, SystemMetric
from apps.monitoring.services import storage_summary
from apps.monitoring.tasks import backup_database
from apps.tasks.models import Project, Task, TaskStatus, Workspace

from .serializers import (
    AdminCreateSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    BackupRecordSerializer,
    SecurityLogSerializer,
)


class AdminUserListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        return User.objects.annotate(task_count=Count("created_tasks")).order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminCreateSerializer
        return AdminUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        AdminLog.objects.create(
            admin=request.user,
            action="admin_created",
            target_user=user,
            metadata={
                "access_level": "super_admin" if user.is_superuser else "admin",
            },
        )
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, id):
        user = get_object_or_404(User, pk=id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AdminLog.objects.create(
            admin=request.user,
            action="user_updated",
            target_user=user,
            metadata={"updated_fields": list(serializer.validated_data.keys())},
        )
        return Response(AdminUserSerializer(user).data)

    def delete(self, request, id):
        user = get_object_or_404(User, pk=id)
        AdminLog.objects.create(admin=request.user, action="user_deleted", target_user=user)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserBanView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, id):
        user = get_object_or_404(User, pk=id)
        user.is_banned = True
        user.save(update_fields=["is_banned", "updated_at"])
        AdminLog.objects.create(admin=request.user, action="user_banned", target_user=user)
        return Response({"detail": "User banned."}, status=status.HTTP_200_OK)


class AdminUserUnbanView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, id):
        user = get_object_or_404(User, pk=id)
        user.is_banned = False
        user.save(update_fields=["is_banned", "updated_at"])
        AdminLog.objects.create(admin=request.user, action="user_unbanned", target_user=user)
        return Response({"detail": "User unbanned."}, status=status.HTTP_200_OK)


class AdminSecurityLogListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    serializer_class = SecurityLogSerializer

    def get_queryset(self):
        return SecurityLog.objects.select_related("user").order_by("-created_at")[:500]


class AdminSystemStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        today = timezone.now().date()
        latest_metric = SystemMetric.objects.first()

        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True, is_banned=False).count()
        total_tasks = Task.objects.count()
        completed_tasks = Task.objects.filter(status__category=TaskStatus.Category.DONE).count()

        # Job Type / Occupation breakdown
        job_types_raw = (
            User.objects.values("job_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        job_type_distribution = []
        for item in job_types_raw:
            label = item["job_type"].strip() or "General / Unspecified"
            # Format nicely
            label_display = label.replace("_", " ").title()
            job_type_distribution.append({
                "name": label_display,
                "count": item["count"],
                "percentage": round((item["count"] / max(total_users, 1)) * 100, 1),
            })

        # Theme preferences breakdown
        theme_raw = (
            User.objects.values("theme_preference")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        theme_distribution = [
            {
                "name": (item["theme_preference"] or "system").capitalize(),
                "count": item["count"],
            }
            for item in theme_raw
        ]

        # Accent color preferences
        color_raw = (
            User.objects.values("accent_color")
            .annotate(count=Count("id"))
            .order_by("-count")[:8]
        )
        color_distribution = [
            {
                "color": item["accent_color"] or "#255A54",
                "count": item["count"],
            }
            for item in color_raw
        ]

        # Recent users
        recent_users = [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "job_type": u.job_type.replace("_", " ").title() if u.job_type else "General User",
                "role": u.role,
                "created_at": u.created_at,
            }
            for u in User.objects.order_by("-created_at")[:6]
        ]

        # Recent security audit events
        recent_security = [
            {
                "id": log.id,
                "event_type": log.event_type,
                "user_email": log.user.email if log.user else "Anonymous",
                "ip_address": log.ip_address,
                "path": log.path,
                "created_at": log.created_at,
                "metadata": log.metadata,
            }
            for log in SecurityLog.objects.select_related("user").order_by("-created_at")[:6]
        ]

        data = {
            "total_users": total_users,
            "active_users": active_users,
            "total_workspaces": Workspace.objects.count(),
            "total_projects": Project.objects.count(),
            "tasks_created": total_tasks,
            "total_completed_tasks": completed_tasks,
            "tasks_completed_today": Task.objects.filter(
                status__category=TaskStatus.Category.DONE,
                completed_at__date=today,
            ).count(),
            "system_storage_usage_bytes": latest_metric.system_storage_usage_bytes if latest_metric else 0,
            "uploaded_files": latest_metric.uploaded_files if latest_metric else 0,
            "job_type_distribution": job_type_distribution,
            "theme_distribution": theme_distribution,
            "color_distribution": color_distribution,
            "recent_users": recent_users,
            "recent_security": recent_security,
            "latest_metrics": {
                "captured_at": latest_metric.captured_at if latest_metric else None,
            },
        }
        return Response(data)


class AdminStorageView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response(storage_summary())


class AdminBackupView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        backups = BackupRecord.objects.all()[:50]
        return Response(BackupRecordSerializer(backups, many=True).data)

    def post(self, request):
        try:
            task = backup_database.delay()
            return Response({"detail": "Backup job started.", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)
        except Exception:
            record_id = backup_database()
            return Response(
                {"detail": "Backup executed synchronously.", "record_id": record_id},
                status=status.HTTP_200_OK,
            )
