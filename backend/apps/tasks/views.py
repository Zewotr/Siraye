from django.db.models import Case, IntegerField, Value, When
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsEmailVerified
from apps.common.permissions import IsActiveAndNotBanned
from apps.notifications.models import Notification

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned, IsEmailVerified]

    def get_queryset(self):
        priority_order = Case(
            When(priority=Task.Priority.HIGH, then=Value(1)),
            When(priority=Task.Priority.MEDIUM, then=Value(2)),
            When(priority=Task.Priority.LOW, then=Value(3)),
            default=Value(4),
            output_field=IntegerField(),
        )

        return (
            Task.objects.filter(user=self.request.user)
            .annotate(priority_order=priority_order)
            .order_by("priority_order", "start_time", "created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["patch"], url_path="complete")
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = Task.Status.COMPLETED
        task.completed_at = timezone.now()
        task.save(update_fields=["status", "completed_at", "updated_at"])

        Notification.objects.create(
            user=task.user,
            task=task,
            notification_type=Notification.NotificationType.TASK_COMPLETED,
            message=f"Task '{task.title}' marked as completed.",
        )

        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
