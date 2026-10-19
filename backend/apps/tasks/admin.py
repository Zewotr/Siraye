from django.contrib import admin

from .models import (
    ChecklistItem,
    Label,
    Project,
    ProjectMembership,
    Task,
    TaskActivity,
    TaskComment,
    TaskStatus,
    Workspace,
    WorkspaceMembership,
)


class WorkspaceMembershipInline(admin.TabularInline):
    model = WorkspaceMembership
    extra = 0


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "slug", "owner", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["name", "slug", "owner__email"]
    inlines = [WorkspaceMembershipInline]


class ProjectMembershipInline(admin.TabularInline):
    model = ProjectMembership
    extra = 0


class TaskStatusInline(admin.TabularInline):
    model = TaskStatus
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "key", "workspace", "is_archived", "created_at"]
    list_filter = ["is_archived", "workspace"]
    search_fields = ["name", "key", "workspace__name"]
    inlines = [ProjectMembershipInline, TaskStatusInline]


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "workspace", "color"]
    list_filter = ["workspace"]
    search_fields = ["name", "workspace__name"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "project", "created_by", "priority", "status", "due_date", "created_at"]
    list_filter = ["priority", "status", "project"]
    search_fields = ["title", "created_by__email", "project__name"]
    filter_horizontal = ["assignees", "labels"]


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ["id", "content", "task", "is_completed", "position"]
    list_filter = ["is_completed"]
    search_fields = ["content", "task__title"]


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ["id", "task", "author", "created_at"]
    search_fields = ["body", "task__title", "author__email"]
    filter_horizontal = ["mentions"]


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = ["id", "task", "actor", "action", "created_at"]
    list_filter = ["action"]
    search_fields = ["task__title", "actor__email"]
