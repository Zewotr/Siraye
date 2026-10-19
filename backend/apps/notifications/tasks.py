from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.tasks.models import Task, TaskStatus

from .models import Notification


@shared_task
def send_upcoming_task_reminders():
    now = timezone.now()
    reminder_start = now + timedelta(minutes=4)
    reminder_end = now + timedelta(minutes=6)

    upcoming_tasks = Task.objects.filter(
        status__category__in=[
            TaskStatus.Category.BACKLOG,
            TaskStatus.Category.TODO,
            TaskStatus.Category.IN_PROGRESS,
            TaskStatus.Category.IN_REVIEW,
        ],
        reminder_sent=False,
        start_time__gte=reminder_start,
        start_time__lte=reminder_end,
    ).select_related("created_by").prefetch_related("assignees")

    reminders_created = 0

    for task in upcoming_tasks:
        recipients = list(task.assignees.filter(is_active=True, is_banned=False))
        if not recipients and task.created_by and task.created_by.is_active and not task.created_by.is_banned:
            recipients = [task.created_by]
        Notification.objects.bulk_create(
            [
                Notification(
                    user=recipient,
                    task=task,
                    notification_type=Notification.NotificationType.REMINDER,
                    message=f"Your task '{task.title}' starts in 5 minutes.",
                )
                for recipient in recipients
            ]
        )
        task.reminder_sent = True
        task.save(update_fields=["reminder_sent", "updated_at"])
        reminders_created += 1

    return reminders_created
