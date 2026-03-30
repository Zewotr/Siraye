from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.tasks.models import Task

from .models import Notification


@shared_task
def send_upcoming_task_reminders():
    now = timezone.now()
    reminder_start = now + timedelta(minutes=4)
    reminder_end = now + timedelta(minutes=6)

    upcoming_tasks = Task.objects.filter(
        status__in=[Task.Status.PENDING, Task.Status.IN_PROGRESS],
        reminder_sent=False,
        start_time__gte=reminder_start,
        start_time__lte=reminder_end,
        user__is_active=True,
        user__is_banned=False,
    ).select_related("user")

    reminders_created = 0

    for task in upcoming_tasks:
        Notification.objects.create(
            user=task.user,
            task=task,
            notification_type=Notification.NotificationType.REMINDER,
            message=f"Your task '{task.title}' starts in 5 minutes.",
        )
        task.reminder_sent = True
        task.save(update_fields=["reminder_sent", "updated_at"])
        reminders_created += 1

    return reminders_created
