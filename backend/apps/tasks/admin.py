from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "user", "priority", "status", "start_time", "end_time", "created_at"]
    list_filter = ["priority", "status"]
    search_fields = ["title", "user__email"]
