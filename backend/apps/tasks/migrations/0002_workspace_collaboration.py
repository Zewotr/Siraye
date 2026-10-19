from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


DEFAULT_STATUSES = (
    ("backlog", "Backlog", "#94A3B8", "backlog", 0),
    ("todo", "Todo", "#60A5FA", "todo", 1),
    ("in-progress", "In Progress", "#A78BFA", "in_progress", 2),
    ("in-review", "In Review", "#FBBF24", "in_review", 3),
    ("done", "Done", "#34D399", "done", 4),
)


def move_personal_tasks_into_projects(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Workspace = apps.get_model("tasks", "Workspace")
    WorkspaceMembership = apps.get_model("tasks", "WorkspaceMembership")
    Project = apps.get_model("tasks", "Project")
    ProjectMembership = apps.get_model("tasks", "ProjectMembership")
    TaskStatus = apps.get_model("tasks", "TaskStatus")
    Task = apps.get_model("tasks", "Task")

    for user in User.objects.all().iterator():
        workspace, _ = Workspace.objects.get_or_create(
            slug=f"personal-{user.pk}",
            defaults={
                "name": f"{user.name or user.email.split('@')[0]}'s workspace",
                "description": "Your original Siraye tasks, now in a collaborative workspace.",
                "icon": "sparkles",
                "color": "#635BFF",
                "owner_id": user.pk,
            },
        )
        WorkspaceMembership.objects.update_or_create(
            workspace_id=workspace.pk,
            user_id=user.pk,
            defaults={"role": "owner"},
        )
        project, _ = Project.objects.get_or_create(
            workspace_id=workspace.pk,
            key="PERSONAL",
            defaults={
                "name": "Personal planning",
                "description": "Tasks migrated from the original personal workspace.",
                "icon": "inbox",
                "color": "#635BFF",
                "created_by_id": user.pk,
            },
        )
        ProjectMembership.objects.update_or_create(
            project_id=project.pk,
            user_id=user.pk,
            defaults={"role": "owner"},
        )

        statuses = {}
        for key, name, color, category, position in DEFAULT_STATUSES:
            status, _ = TaskStatus.objects.get_or_create(
                project_id=project.pk,
                key=key,
                defaults={
                    "name": name,
                    "color": color,
                    "category": category,
                    "position": position,
                },
            )
            statuses[key] = status

        legacy_map = {
            "pending": "todo",
            "in_progress": "in-progress",
            "completed": "done",
        }
        positions = {key: 0 for key in statuses}
        legacy_tasks = Task.objects.filter(created_by_id=user.pk, project__isnull=True).order_by("created_at", "id")
        for task in legacy_tasks.iterator():
            status_key = legacy_map.get(task.legacy_status, "todo")
            task.project_id = project.pk
            task.status_id = statuses[status_key].pk
            task.position = positions[status_key]
            positions[status_key] += 1
            task.save(update_fields=["project", "status", "position"])
            task.assignees.add(user.pk)


def reverse_personal_task_migration(apps, schema_editor):
    # Legacy task ownership cannot be reconstructed after collaboration begins.
    pass


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Workspace",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(max_length=140, unique=True)),
                ("description", models.TextField(blank=True)),
                ("icon", models.CharField(default="sparkles", max_length=32)),
                ("color", models.CharField(default="#635BFF", max_length=7)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="owned_workspaces",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="WorkspaceMembership",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "role",
                    models.CharField(
                        choices=[("owner", "Owner"), ("admin", "Admin"), ("member", "Member"), ("viewer", "Viewer")],
                        default="member",
                        max_length=16,
                    ),
                ),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_memberships", to=settings.AUTH_USER_MODEL),
                ),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="tasks.workspace")),
            ],
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=160)),
                ("key", models.CharField(max_length=12)),
                ("description", models.TextField(blank=True)),
                ("icon", models.CharField(default="layers", max_length=32)),
                ("color", models.CharField(default="#635BFF", max_length=7)),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_projects", to=settings.AUTH_USER_MODEL),
                ),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="projects", to="tasks.workspace")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="ProjectMembership",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "role",
                    models.CharField(
                        choices=[("owner", "Owner"), ("admin", "Admin"), ("member", "Member"), ("viewer", "Viewer")],
                        default="member",
                        max_length=16,
                    ),
                ),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="tasks.project")),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_memberships", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="TaskStatus",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=80)),
                ("key", models.SlugField(max_length=80)),
                ("color", models.CharField(default="#94A3B8", max_length=7)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("backlog", "Backlog"),
                            ("todo", "Todo"),
                            ("in_progress", "In Progress"),
                            ("in_review", "In Review"),
                            ("done", "Done"),
                        ],
                        default="todo",
                        max_length=20,
                    ),
                ),
                ("position", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="statuses", to="tasks.project")),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.CreateModel(
            name="Label",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=48)),
                ("color", models.CharField(default="#64748B", max_length=7)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="labels", to="tasks.workspace")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.RemoveIndex(model_name="task", name="tasks_task_user_id_5fdbd1_idx"),
        migrations.RemoveIndex(model_name="task", name="tasks_task_user_id_8bcc80_idx"),
        migrations.RenameField(model_name="task", old_name="user", new_name="created_by"),
        migrations.RenameField(model_name="task", old_name="status", new_name="legacy_status"),
        migrations.AlterField(
            model_name="task",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_tasks", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name="task",
            name="priority",
            field=models.CharField(
                choices=[("urgent", "Urgent"), ("high", "High"), ("medium", "Medium"), ("low", "Low"), ("none", "None")],
                default="none",
                max_length=10,
            ),
        ),
        migrations.AlterField(model_name="task", name="start_time", field=models.DateTimeField(blank=True, null=True)),
        migrations.AlterField(model_name="task", name="end_time", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="task", name="due_date", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="task", name="position", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(
            model_name="task",
            name="project",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="tasks.project"),
        ),
        migrations.AddField(
            model_name="task",
            name="status",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="tasks", to="tasks.taskstatus"),
        ),
        migrations.AddField(
            model_name="task",
            name="assignees",
            field=models.ManyToManyField(blank=True, related_name="assigned_tasks", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="task",
            name="labels",
            field=models.ManyToManyField(blank=True, related_name="tasks", to="tasks.label"),
        ),
        migrations.CreateModel(
            name="ChecklistItem",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("content", models.CharField(max_length=500)),
                ("is_completed", models.BooleanField(default=False)),
                ("position", models.PositiveIntegerField(default=0)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_checklist_items", to=settings.AUTH_USER_MODEL),
                ),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="checklist_items", to="tasks.task")),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.CreateModel(
            name="TaskComment",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("body", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "author",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="task_comments", to=settings.AUTH_USER_MODEL),
                ),
                ("mentions", models.ManyToManyField(blank=True, related_name="mentioned_in_comments", to=settings.AUTH_USER_MODEL)),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="tasks.task")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="TaskActivity",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("created", "Created"),
                            ("updated", "Updated"),
                            ("status_changed", "Status Changed"),
                            ("assigned", "Assigned"),
                            ("commented", "Commented"),
                            ("checklist_updated", "Checklist Updated"),
                        ],
                        max_length=32,
                    ),
                ),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="task_activity", to=settings.AUTH_USER_MODEL),
                ),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="activity", to="tasks.task")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.RunPython(move_personal_tasks_into_projects, reverse_personal_task_migration),
        migrations.AlterField(
            model_name="task",
            name="project",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="tasks.project"),
        ),
        migrations.AlterField(
            model_name="task",
            name="status",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="tasks", to="tasks.taskstatus"),
        ),
        migrations.RemoveField(model_name="task", name="legacy_status"),
        migrations.AddConstraint(
            model_name="workspacemembership",
            constraint=models.UniqueConstraint(fields=("workspace", "user"), name="unique_workspace_member"),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(fields=("workspace", "key"), name="unique_project_key_per_workspace"),
        ),
        migrations.AddConstraint(
            model_name="projectmembership",
            constraint=models.UniqueConstraint(fields=("project", "user"), name="unique_project_member"),
        ),
        migrations.AddConstraint(
            model_name="taskstatus",
            constraint=models.UniqueConstraint(fields=("project", "key"), name="unique_status_key_per_project"),
        ),
        migrations.AddConstraint(
            model_name="taskstatus",
            constraint=models.UniqueConstraint(fields=("project", "position"), name="unique_status_position_per_project"),
        ),
        migrations.AddConstraint(
            model_name="label",
            constraint=models.UniqueConstraint(fields=("workspace", "name"), name="unique_label_name_per_workspace"),
        ),
        migrations.AlterModelOptions(name="task", options={"ordering": ["position", "created_at"]}),
        migrations.AddIndex(model_name="workspacemembership", index=models.Index(fields=["user", "workspace"], name="tasks_works_user_id_a3eef3_idx")),
        migrations.AddIndex(model_name="workspacemembership", index=models.Index(fields=["workspace", "role"], name="tasks_works_workspa_8e52dd_idx")),
        migrations.AddIndex(model_name="project", index=models.Index(fields=["workspace", "is_archived"], name="tasks_proje_workspa_c53781_idx")),
        migrations.AddIndex(model_name="projectmembership", index=models.Index(fields=["user", "project"], name="tasks_proje_user_id_0c6203_idx")),
        migrations.AddIndex(model_name="projectmembership", index=models.Index(fields=["project", "role"], name="tasks_proje_project_9f27c2_idx")),
        migrations.AddIndex(model_name="task", index=models.Index(fields=["project", "status", "position"], name="tasks_task_project_2be575_idx")),
        migrations.AddIndex(model_name="task", index=models.Index(fields=["project", "due_date"], name="tasks_task_project_7e5965_idx")),
        migrations.AddIndex(model_name="task", index=models.Index(fields=["due_date", "reminder_sent"], name="tasks_task_due_dat_656a74_idx")),
        migrations.AddIndex(model_name="task", index=models.Index(fields=["created_by", "priority"], name="tasks_task_created_53001c_idx")),
        migrations.AddIndex(model_name="checklistitem", index=models.Index(fields=["task", "position"], name="tasks_check_task_id_06e629_idx")),
        migrations.AddIndex(model_name="taskcomment", index=models.Index(fields=["task", "created_at"], name="tasks_taskc_task_id_3f97e8_idx")),
        migrations.AddIndex(model_name="taskactivity", index=models.Index(fields=["task", "created_at"], name="tasks_taska_task_id_88cdfc_idx")),
        migrations.RenameIndex(
            model_name="task",
            old_name="tasks_task_start_t_4ef11e_idx",
            new_name="tasks_task_start_t_df092a_idx",
        ),
    ]
