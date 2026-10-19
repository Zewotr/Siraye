from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.tasks.models import (
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


DEFAULT_STATUSES = (
    ("backlog", "Backlog", "#94A3B8", TaskStatus.Category.BACKLOG),
    ("todo", "Todo", "#60A5FA", TaskStatus.Category.TODO),
    ("in-progress", "In Progress", "#A78BFA", TaskStatus.Category.IN_PROGRESS),
    ("in-review", "In Review", "#FBBF24", TaskStatus.Category.IN_REVIEW),
    ("done", "Done", "#34D399", TaskStatus.Category.DONE),
)


class Command(BaseCommand):
    help = "Create an idempotent, recruiter-friendly Siraye collaboration workspace."

    def handle(self, *args, **options):
        users = {
            "demo": self._user("demo@siraye.app", "Avery Morgan"),
            "alex": self._user("alex@siraye.app", "Alex Kim"),
            "sam": self._user("sam@siraye.app", "Sam Rivera"),
            "jordan": self._user("jordan@siraye.app", "Jordan Lee"),
        }
        workspace, _ = Workspace.objects.get_or_create(
            slug="northstar-studio",
            defaults={
                "name": "Northstar Studio",
                "description": "A product team building calm, focused software.",
                "icon": "sparkles",
                "color": "#635BFF",
                "owner": users["demo"],
            },
        )
        workspace_members = {
            "demo": WorkspaceMembership.Role.OWNER,
            "alex": WorkspaceMembership.Role.ADMIN,
            "sam": WorkspaceMembership.Role.MEMBER,
            "jordan": WorkspaceMembership.Role.VIEWER,
        }
        for key, role in workspace_members.items():
            WorkspaceMembership.objects.update_or_create(
                workspace=workspace,
                user=users[key],
                defaults={"role": role},
            )

        labels = {}
        for name, color in (("Design", "#EC4899"), ("Engineering", "#6366F1"), ("Research", "#14B8A6"), ("Launch", "#F97316"), ("Blocked", "#EF4444")):
            labels[name], _ = Label.objects.get_or_create(workspace=workspace, name=name, defaults={"color": color})

        launch = self._project(workspace, users["demo"], "Launch Command Center", "LAUNCH", "Coordinate a focused beta launch with confidence.", "#635BFF")
        mobile = self._project(workspace, users["alex"], "Mobile Experience", "MOBILE", "Make the mobile workflow feel as considered as desktop.", "#14B8A6")
        self._members(launch, users, {"demo": "owner", "alex": "admin", "sam": "member", "jordan": "viewer"})
        self._members(mobile, users, {"demo": "owner", "alex": "admin", "sam": "member"})

        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        launch_statuses = self._statuses(launch)
        mobile_statuses = self._statuses(mobile)

        tasks = [
            self._task(
                launch,
                launch_statuses["in-progress"],
                users["demo"],
                "Design the beta onboarding flow",
                "Map the first five minutes so new teams understand value before configuration.",
                Task.Priority.HIGH,
                now + timedelta(days=2),
                [users["demo"], users["alex"]],
                [labels["Design"], labels["Launch"]],
            ),
            self._task(
                launch,
                launch_statuses["in-review"],
                users["sam"],
                "Instrument activation events",
                "Track invite, first project, first task, and first completion in the product funnel.",
                Task.Priority.URGENT,
                now + timedelta(days=1),
                [users["sam"], users["demo"]],
                [labels["Engineering"], labels["Launch"]],
            ),
            self._task(
                launch,
                launch_statuses["todo"],
                users["alex"],
                "Recruit five design partners",
                "Shortlist teams that value a polished, collaborative planning workflow.",
                Task.Priority.MEDIUM,
                now + timedelta(days=4),
                [users["alex"]],
                [labels["Research"], labels["Launch"]],
            ),
            self._task(
                launch,
                launch_statuses["backlog"],
                users["demo"],
                "Write the launch retrospective template",
                "Capture what we learn while the decision context is still fresh.",
                Task.Priority.LOW,
                now + timedelta(days=12),
                [users["demo"]],
                [labels["Launch"]],
            ),
            self._task(
                launch,
                launch_statuses["done"],
                users["sam"],
                "Set up the feedback triage ritual",
                "A lightweight weekly cadence for consolidating beta feedback.",
                Task.Priority.MEDIUM,
                now - timedelta(days=1),
                [users["sam"]],
                [labels["Research"]],
            ),
            self._task(
                mobile,
                mobile_statuses["in-progress"],
                users["alex"],
                "Prototype quick-add on mobile",
                "Make creating a task possible with one thumb and no cognitive overhead.",
                Task.Priority.HIGH,
                now + timedelta(days=3),
                [users["alex"], users["sam"]],
                [labels["Design"], labels["Engineering"]],
            ),
            self._task(
                mobile,
                mobile_statuses["todo"],
                users["demo"],
                "Audit responsive task detail",
                "Review every task-detail interaction at narrow viewport widths.",
                Task.Priority.MEDIUM,
                now + timedelta(days=5),
                [users["demo"]],
                [labels["Design"]],
            ),
        ]

        onboarding = tasks[0]
        self._checklist(onboarding, users["demo"], ["Draft the happy path", "Review empty states", "Prototype the invite moment"])
        comment, _ = TaskComment.objects.get_or_create(
            task=onboarding,
            author=users["alex"],
            body="I added a lighter first-run path. @Avery, could you validate the copy tomorrow?",
        )
        comment.mentions.set([users["demo"]])
        TaskActivity.objects.get_or_create(
            task=onboarding,
            actor=users["alex"],
            action=TaskActivity.Action.COMMENTED,
            metadata={"comment_id": comment.id},
        )

        self.stdout.write(self.style.SUCCESS("Demo workspace ready: Northstar Studio"))
        self.stdout.write("Sign in with demo@siraye.app through the existing email sign-in flow to explore it.")

    def _user(self, email, name):
        user, created = User.objects.get_or_create(email=email, defaults={"name": name, "is_active": True})
        if created:
            user.set_password("siraye-demo-only")
            user.save(update_fields=["password"])
        return user

    def _project(self, workspace, creator, name, key, description, color):
        project, _ = Project.objects.get_or_create(
            workspace=workspace,
            key=key,
            defaults={"name": name, "description": description, "color": color, "created_by": creator},
        )
        for position, (status_key, status_name, status_color, category) in enumerate(DEFAULT_STATUSES):
            TaskStatus.objects.get_or_create(
                project=project,
                key=status_key,
                defaults={"name": status_name, "color": status_color, "category": category, "position": position},
            )
        return project

    def _members(self, project, users, roles):
        for key, role in roles.items():
            ProjectMembership.objects.update_or_create(project=project, user=users[key], defaults={"role": role})

    def _statuses(self, project):
        return {item.key: item for item in project.statuses.all()}

    def _task(self, project, status, creator, title, description, priority, due_date, assignees, labels):
        task, created = Task.objects.get_or_create(
            project=project,
            title=title,
            defaults={
                "description": description,
                "priority": priority,
                "status": status,
                "created_by": creator,
                "due_date": due_date,
                "start_time": due_date - timedelta(hours=2),
                "end_time": due_date - timedelta(hours=1),
                "completed_at": timezone.now() if status.is_done else None,
                "position": Task.objects.filter(project=project, status=status).count(),
            },
        )
        task.assignees.set(assignees)
        task.labels.set(labels)
        if created:
            TaskActivity.objects.create(task=task, actor=creator, action=TaskActivity.Action.CREATED)
        return task

    def _checklist(self, task, user, items):
        for position, content in enumerate(items):
            ChecklistItem.objects.get_or_create(
                task=task,
                content=content,
                defaults={"position": position, "created_by": user, "is_completed": position == 0},
            )
