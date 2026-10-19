from django.conf import settings
from django.db import models


class Workspace(models.Model):
    """A team's top-level collaboration boundary."""

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=32, default="sparkles")
    color = models.CharField(max_length=7, default="#635BFF")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="owned_workspaces",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class WorkspaceMembership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey(Workspace, related_name="memberships", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="workspace_memberships", on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "user"], name="unique_workspace_member"),
        ]
        indexes = [
            models.Index(fields=["user", "workspace"]),
            models.Index(fields=["workspace", "role"]),
        ]

    def __str__(self):
        return f"{self.user_id} in {self.workspace_id} ({self.role})"


class Project(models.Model):
    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey(Workspace, related_name="projects", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    key = models.CharField(max_length=12)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=32, default="layers")
    color = models.CharField(max_length=7, default="#635BFF")
    is_archived = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_projects",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "key"], name="unique_project_key_per_workspace"),
        ]
        indexes = [models.Index(fields=["workspace", "is_archived"])]
        ordering = ["name"]

    def __str__(self):
        return f"{self.workspace_id}/{self.key}"


class ProjectMembership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    id = models.BigAutoField(primary_key=True)
    project = models.ForeignKey(Project, related_name="memberships", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="project_memberships", on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "user"], name="unique_project_member"),
        ]
        indexes = [
            models.Index(fields=["user", "project"]),
            models.Index(fields=["project", "role"]),
        ]

    def __str__(self):
        return f"{self.user_id} in {self.project_id} ({self.role})"


class TaskStatus(models.Model):
    class Category(models.TextChoices):
        BACKLOG = "backlog", "Backlog"
        TODO = "todo", "Todo"
        IN_PROGRESS = "in_progress", "In Progress"
        IN_REVIEW = "in_review", "In Review"
        DONE = "done", "Done"

    id = models.BigAutoField(primary_key=True)
    project = models.ForeignKey(Project, related_name="statuses", on_delete=models.CASCADE)
    name = models.CharField(max_length=80)
    key = models.SlugField(max_length=80)
    color = models.CharField(max_length=7, default="#94A3B8")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.TODO)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "key"], name="unique_status_key_per_project"),
            models.UniqueConstraint(fields=["project", "position"], name="unique_status_position_per_project"),
        ]
        ordering = ["position", "id"]

    @property
    def is_done(self):
        return self.category == self.Category.DONE

    def __str__(self):
        return f"{self.project_id}: {self.name}"


class Label(models.Model):
    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey(Workspace, related_name="labels", on_delete=models.CASCADE)
    name = models.CharField(max_length=48)
    color = models.CharField(max_length=7, default="#64748B")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "name"], name="unique_label_name_per_workspace"),
        ]
        ordering = ["name"]

    def __str__(self):
        return self.name


class Task(models.Model):
    class Priority(models.TextChoices):
        URGENT = "urgent", "Urgent"
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"
        NONE = "none", "None"

    id = models.BigAutoField(primary_key=True)
    project = models.ForeignKey(Project, related_name="tasks", on_delete=models.CASCADE)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_tasks",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NONE)
    status = models.ForeignKey(TaskStatus, related_name="tasks", on_delete=models.PROTECT)
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="assigned_tasks", blank=True)
    labels = models.ManyToManyField(Label, related_name="tasks", blank=True)
    due_date = models.DateTimeField(blank=True, null=True)
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "status", "position"]),
            models.Index(fields=["project", "due_date"]),
            models.Index(fields=["due_date", "reminder_sent"]),
            models.Index(fields=["start_time", "reminder_sent"]),
            models.Index(fields=["created_by", "priority"]),
        ]
        ordering = ["position", "created_at"]

    def __str__(self):
        return f"{self.title} ({self.project_id})"


class ChecklistItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    task = models.ForeignKey(Task, related_name="checklist_items", on_delete=models.CASCADE)
    content = models.CharField(max_length=500)
    is_completed = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_checklist_items",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]
        indexes = [models.Index(fields=["task", "position"])]

    def __str__(self):
        return self.content


class TaskComment(models.Model):
    id = models.BigAutoField(primary_key=True)
    task = models.ForeignKey(Task, related_name="comments", on_delete=models.CASCADE)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="task_comments",
        on_delete=models.SET_NULL,
        null=True,
    )
    body = models.TextField()
    mentions = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="mentioned_in_comments", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["task", "created_at"])]

    def __str__(self):
        return f"Comment {self.id} on task {self.task_id}"


class TaskActivity(models.Model):
    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        STATUS_CHANGED = "status_changed", "Status Changed"
        ASSIGNED = "assigned", "Assigned"
        COMMENTED = "commented", "Commented"
        CHECKLIST_UPDATED = "checklist_updated", "Checklist Updated"

    id = models.BigAutoField(primary_key=True)
    task = models.ForeignKey(Task, related_name="activity", on_delete=models.CASCADE)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="task_activity",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=32, choices=Action.choices)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["task", "created_at"])]

    def __str__(self):
        return f"{self.action} on {self.task_id}"
