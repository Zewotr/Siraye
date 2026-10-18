from django.db import transaction
from django.db.models import Case, Count, IntegerField, Max, OuterRef, Q, Subquery, Value, When
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.common.permissions import IsActiveAndNotBanned
from apps.notifications.models import Notification

from .access import (
    can_contribute_to_project,
    can_manage_project,
    can_manage_workspace,
    can_view_project,
    visible_projects,
    workspace_role,
)
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
from .serializers import (
    ChecklistItemSerializer,
    LabelSerializer,
    ProjectMembershipSerializer,
    ProjectSerializer,
    TaskCommentSerializer,
    TaskDetailSerializer,
    TaskSerializer,
    TaskStatusSerializer,
    WorkspaceMembershipSerializer,
    WorkspaceSerializer,
)


DEFAULT_STATUSES = (
    ("backlog", "Backlog", "#94A3B8", TaskStatus.Category.BACKLOG),
    ("todo", "Todo", "#60A5FA", TaskStatus.Category.TODO),
    ("in-progress", "In Progress", "#A78BFA", TaskStatus.Category.IN_PROGRESS),
    ("in-review", "In Review", "#FBBF24", TaskStatus.Category.IN_REVIEW),
    ("done", "Done", "#34D399", TaskStatus.Category.DONE),
)


def create_default_statuses(project):
    for position, (key, name, color, category) in enumerate(DEFAULT_STATUSES):
        TaskStatus.objects.get_or_create(
            project=project,
            key=key,
            defaults={"name": name, "color": color, "category": category, "position": position},
        )


def unique_workspace_slug(value):
    base = slugify(value)[:120] or "workspace"
    candidate = base
    number = 2
    while Workspace.objects.filter(slug=candidate).exists():
        suffix = f"-{number}"
        candidate = f"{base[: 140 - len(suffix)]}{suffix}"
        number += 1
    return candidate


def is_workspace_contributor(user, workspace):
    return workspace_role(user, workspace) in {
        WorkspaceMembership.Role.OWNER,
        WorkspaceMembership.Role.ADMIN,
        WorkspaceMembership.Role.MEMBER,
    }


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get_queryset(self):
        user = self.request.user
        memberships = WorkspaceMembership.objects.filter(workspace=OuterRef("pk"), user=user)
        queryset = Workspace.objects.all() if user.role == "admin" else Workspace.objects.filter(memberships__user=user)
        return (
            queryset.annotate(
                member_count=Count("memberships", distinct=True),
                project_count=Count("projects", distinct=True),
                current_role=Subquery(memberships.values("role")[:1]),
            )
            .select_related("owner")
            .distinct()
        )

    def perform_create(self, serializer):
        workspace = serializer.save(owner=self.request.user, slug=unique_workspace_slug(serializer.validated_data.get("slug") or serializer.validated_data["name"]))
        WorkspaceMembership.objects.create(workspace=workspace, user=self.request.user, role=WorkspaceMembership.Role.OWNER)

    def perform_update(self, serializer):
        if not can_manage_workspace(self.request.user, serializer.instance):
            raise PermissionDenied("Workspace administrators can update workspace settings.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin" and instance.owner_id != self.request.user.id:
            raise PermissionDenied("Only the workspace owner can delete a workspace.")
        instance.delete()

    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        workspace = self.get_object()
        if request.method == "GET":
            members = workspace.memberships.select_related("user").order_by("role", "user__name")
            return Response(WorkspaceMembershipSerializer(members, many=True).data)
        if not can_manage_workspace(request.user, workspace):
            raise PermissionDenied("Workspace administrators can manage members.")
        serializer = WorkspaceMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member, created = WorkspaceMembership.objects.update_or_create(
            workspace=workspace,
            user=serializer.validated_data["user"],
            defaults={"role": serializer.validated_data.get("role", WorkspaceMembership.Role.MEMBER)},
        )
        return Response(WorkspaceMembershipSerializer(member).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["patch", "delete"], url_path=r"members/(?P<member_id>[^/.]+)")
    def member_detail(self, request, pk=None, member_id=None):
        workspace = self.get_object()
        if not can_manage_workspace(request.user, workspace):
            raise PermissionDenied("Workspace administrators can manage members.")
        member = workspace.memberships.filter(pk=member_id).first()
        if not member:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)
        if member.role == WorkspaceMembership.Role.OWNER and request.user.role != "admin":
            raise ValidationError("Transfer ownership before changing or removing the workspace owner.")
        if request.method == "DELETE":
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = WorkspaceMembershipSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get_queryset(self):
        user = self.request.user
        role_subquery = ProjectMembership.objects.filter(project=OuterRef("pk"), user=user)
        queryset = visible_projects(user).select_related("workspace", "created_by").prefetch_related("statuses")
        workspace_id = self.request.query_params.get("workspace")
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        if self.request.query_params.get("archived") in {"true", "false"}:
            queryset = queryset.filter(is_archived=self.request.query_params["archived"] == "true")
        return queryset.annotate(
            member_count=Count("memberships", distinct=True),
            task_count=Count("tasks", distinct=True),
            current_role=Subquery(role_subquery.values("role")[:1]),
        )

    def perform_create(self, serializer):
        workspace = serializer.validated_data["workspace"]
        if not is_workspace_contributor(self.request.user, workspace):
            raise PermissionDenied("Workspace membership is required to create a project.")
        with transaction.atomic():
            project = serializer.save(created_by=self.request.user)
            ProjectMembership.objects.get_or_create(
                project=project,
                user=self.request.user,
                defaults={"role": ProjectMembership.Role.OWNER},
            )
            create_default_statuses(project)

    def perform_update(self, serializer):
        if not can_manage_project(self.request.user, serializer.instance):
            raise PermissionDenied("Project administrators can update project settings.")
        serializer.save()

    def perform_destroy(self, instance):
        if not can_manage_project(self.request.user, instance):
            raise PermissionDenied("Project administrators can delete projects.")
        instance.delete()

    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == "GET":
            members = project.memberships.select_related("user").order_by("role", "user__name")
            return Response(ProjectMembershipSerializer(members, many=True).data)
        if not can_manage_project(request.user, project):
            raise PermissionDenied("Project administrators can manage members.")
        serializer = ProjectMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        if not WorkspaceMembership.objects.filter(workspace=project.workspace, user=user).exists():
            raise ValidationError({"user_id": "Add this person to the workspace before adding them to a project."})
        member, created = ProjectMembership.objects.update_or_create(
            project=project,
            user=user,
            defaults={"role": serializer.validated_data.get("role", ProjectMembership.Role.MEMBER)},
        )
        return Response(ProjectMembershipSerializer(member).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["patch", "delete"], url_path=r"members/(?P<member_id>[^/.]+)")
    def member_detail(self, request, pk=None, member_id=None):
        project = self.get_object()
        if not can_manage_project(request.user, project):
            raise PermissionDenied("Project administrators can manage members.")
        member = project.memberships.filter(pk=member_id).first()
        if not member:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)
        if member.role == ProjectMembership.Role.OWNER and request.user.role != "admin":
            raise ValidationError("Transfer project ownership before changing or removing its owner.")
        if request.method == "DELETE":
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = ProjectMembershipSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"], url_path="statuses")
    def statuses(self, request, pk=None):
        project = self.get_object()
        if request.method == "GET":
            return Response(TaskStatusSerializer(project.statuses.all(), many=True).data)
        if not can_manage_project(request.user, project):
            raise PermissionDenied("Project administrators can customize statuses.")
        serializer = TaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LabelViewSet(viewsets.ModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get_queryset(self):
        user = self.request.user
        queryset = Label.objects.all() if user.role == "admin" else Label.objects.filter(workspace__memberships__user=user)
        workspace_id = self.request.query_params.get("workspace")
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        return queryset.select_related("workspace").distinct()

    def _ensure_manage_access(self, workspace):
        if not can_manage_workspace(self.request.user, workspace):
            raise PermissionDenied("Workspace administrators can manage labels.")

    def perform_create(self, serializer):
        self._ensure_manage_access(serializer.validated_data["workspace"])
        serializer.save()

    def perform_update(self, serializer):
        self._ensure_manage_access(serializer.instance.workspace)
        workspace = serializer.validated_data.get("workspace", serializer.instance.workspace)
        self._ensure_manage_access(workspace)
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_manage_access(instance.workspace)
        instance.delete()


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get_serializer_class(self):
        return TaskDetailSerializer if self.action == "retrieve" else TaskSerializer

    def get_queryset(self):
        queryset = (
            Task.objects.filter(project__in=visible_projects(self.request.user))
            .select_related("project", "project__workspace", "created_by", "status")
            .prefetch_related(
                "assignees",
                "labels",
                "checklist_items",
                "comments__author",
                "comments__mentions",
                "activity__actor",
            )
            .distinct()
        )
        params = self.request.query_params
        if params.get("project"):
            queryset = queryset.filter(project_id=params["project"])
        if params.get("workspace"):
            queryset = queryset.filter(project__workspace_id=params["workspace"])
        if params.get("status"):
            queryset = queryset.filter(status_id=params["status"])
        if params.get("status_key"):
            queryset = queryset.filter(status__key=params["status_key"])
        if params.get("priority"):
            queryset = queryset.filter(priority=params["priority"])
        if params.get("assignee") == "me" or params.get("mine") == "true":
            queryset = queryset.filter(Q(assignees=self.request.user) | Q(created_by=self.request.user))
        elif params.get("assignee"):
            queryset = queryset.filter(assignees__id=params["assignee"])
        if params.get("search"):
            queryset = queryset.filter(Q(title__icontains=params["search"]) | Q(description__icontains=params["search"]))
        if params.get("due_before"):
            queryset = queryset.filter(due_date__date__lte=params["due_before"])
        if params.get("due_after"):
            queryset = queryset.filter(due_date__date__gte=params["due_after"])
        if params.get("completed") == "true":
            queryset = queryset.filter(status__category=TaskStatus.Category.DONE)
        if params.get("completed") == "false":
            queryset = queryset.exclude(status__category=TaskStatus.Category.DONE)

        ordering = params.get("ordering", "position")
        valid_ordering = {"position", "-position", "due_date", "-due_date", "created_at", "-created_at", "updated_at", "-updated_at", "priority"}
        if ordering not in valid_ordering:
            ordering = "position"
        priority_order = Case(
            When(priority=Task.Priority.URGENT, then=Value(0)),
            When(priority=Task.Priority.HIGH, then=Value(1)),
            When(priority=Task.Priority.MEDIUM, then=Value(2)),
            When(priority=Task.Priority.LOW, then=Value(3)),
            default=Value(4),
            output_field=IntegerField(),
        )
        if ordering == "priority":
            return queryset.annotate(priority_order=priority_order).order_by("priority_order", "due_date", "created_at")
        return queryset.order_by(ordering, "created_at")

    def _ensure_contributor(self, task_or_project):
        project = task_or_project.project if isinstance(task_or_project, Task) else task_or_project
        if not can_contribute_to_project(self.request.user, project):
            raise PermissionDenied("Viewer access does not allow task changes.")

    def perform_create(self, serializer):
        user = self.request.user
        project = serializer.validated_data.get("project")
        if not project:
            project_id = self.request.data.get("project") or self.request.query_params.get("project")
            if project_id:
                project = Project.objects.filter(pk=project_id).first()
            if not project:
                project = visible_projects(user).first()
            if not project:
                workspace = Workspace.objects.filter(memberships__user=user).first()
                if not workspace:
                    workspace = Workspace.objects.create(
                        owner=user,
                        name=f"{user.name}'s Workspace",
                        slug=unique_workspace_slug(f"{user.name}-workspace"),
                        color="#255a54",
                    )
                    WorkspaceMembership.objects.create(
                        workspace=workspace,
                        user=user,
                        role=WorkspaceMembership.Role.OWNER,
                    )
                project = Project.objects.create(
                    workspace=workspace,
                    name="General",
                    key="GEN",
                    description="Default project for tasks",
                    color="#255a54",
                )
                create_default_statuses(project)

        self._ensure_contributor(project)

        status_obj = serializer.validated_data.get("status")
        status_key = serializer.validated_data.get("status_key") or self.request.data.get("status")
        if not status_obj and status_key and isinstance(status_key, str):
            status_key_clean = status_key.lower().replace(" ", "_").replace("-", "_")
            if status_key_clean in {"done", "completed"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.DONE).first()
            elif status_key_clean in {"in_progress", "inprogress"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.IN_PROGRESS).first()
            elif status_key_clean in {"in_review", "review"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.IN_REVIEW).first()
            elif status_key_clean in {"backlog"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.BACKLOG).first()
            else:
                status_obj = project.statuses.filter(category=TaskStatus.Category.TODO).first()

        if not status_obj:
            status_obj = project.statuses.filter(category=TaskStatus.Category.TODO).first() or project.statuses.first()
            if not status_obj:
                create_default_statuses(project)
                status_obj = project.statuses.filter(category=TaskStatus.Category.TODO).first() or project.statuses.first()

        due_date = serializer.validated_data.get("due_date")
        if not due_date:
            due_date = serializer.validated_data.get("end_time") or serializer.validated_data.get("start_time")

        position = serializer.validated_data.get("position")
        if position is None:
            position = (Task.objects.filter(project=project, status=status_obj).aggregate(last=Max("position"))["last"] or -1) + 1

        completed_at = timezone.now() if (status_obj and status_obj.is_done) else None

        task = serializer.save(
            project=project,
            status=status_obj,
            created_by=user,
            position=position,
            due_date=due_date,
            completed_at=completed_at,
        )
        TaskActivity.objects.create(task=task, actor=user, action=TaskActivity.Action.CREATED)

    def perform_update(self, serializer):
        task = serializer.instance
        self._ensure_contributor(task)
        project = task.project
        previous_status_id = task.status_id
        previous_assignee_ids = set(task.assignees.values_list("id", flat=True))

        status_obj = serializer.validated_data.get("status")
        status_key = serializer.validated_data.get("status_key") or self.request.data.get("status")
        if not status_obj and status_key and isinstance(status_key, str):
            status_key_clean = status_key.lower().replace(" ", "_").replace("-", "_")
            if status_key_clean in {"done", "completed"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.DONE).first()
            elif status_key_clean in {"in_progress", "inprogress"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.IN_PROGRESS).first()
            elif status_key_clean in {"in_review", "review"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.IN_REVIEW).first()
            elif status_key_clean in {"backlog"}:
                status_obj = project.statuses.filter(category=TaskStatus.Category.BACKLOG).first()
            else:
                status_obj = project.statuses.filter(category=TaskStatus.Category.TODO).first()

        extra_kwargs = {}
        if status_obj:
            extra_kwargs["status"] = status_obj

        due_date = serializer.validated_data.get("due_date")
        if not due_date and (serializer.validated_data.get("end_time") or serializer.validated_data.get("start_time")):
            extra_kwargs["due_date"] = serializer.validated_data.get("end_time") or serializer.validated_data.get("start_time")

        updated_task = serializer.save(**extra_kwargs)
        changed = []
        if previous_status_id != updated_task.status_id:
            changed.append("status")
            updated_task.completed_at = timezone.now() if updated_task.status.is_done else None
            updated_task.save(update_fields=["completed_at", "updated_at"])
            TaskActivity.objects.create(
                task=updated_task,
                actor=self.request.user,
                action=TaskActivity.Action.STATUS_CHANGED,
                metadata={"status": updated_task.status.name},
            )
        assignee_ids = set(updated_task.assignees.values_list("id", flat=True))
        if previous_assignee_ids != assignee_ids:
            changed.append("assignees")
            TaskActivity.objects.create(
                task=updated_task,
                actor=self.request.user,
                action=TaskActivity.Action.ASSIGNED,
                metadata={"assignee_ids": sorted(assignee_ids)},
            )
        if not changed:
            TaskActivity.objects.create(task=updated_task, actor=self.request.user, action=TaskActivity.Action.UPDATED)

    def perform_destroy(self, instance):
        self._ensure_contributor(instance)
        instance.delete()

    @action(detail=True, methods=["patch"], url_path="complete")
    def complete(self, request, pk=None):
        task = self.get_object()
        self._ensure_contributor(task)
        done_status = task.project.statuses.filter(category=TaskStatus.Category.DONE).first()
        if not done_status:
            raise ValidationError("Create a Done status before completing this task.")
        task.status = done_status
        task.completed_at = timezone.now()
        task.save(update_fields=["status", "completed_at", "updated_at"])
        TaskActivity.objects.create(
            task=task,
            actor=request.user,
            action=TaskActivity.Action.STATUS_CHANGED,
            metadata={"status": done_status.name},
        )
        recipients = list(task.assignees.exclude(pk=request.user.pk))
        if not recipients and task.created_by_id and task.created_by_id != request.user.id:
            recipients = [task.created_by]
        Notification.objects.bulk_create(
            [
                Notification(
                    user=recipient,
                    task=task,
                    notification_type=Notification.NotificationType.TASK_COMPLETED,
                    message=f"Task '{task.title}' was marked as done.",
                )
                for recipient in recipients
            ]
        )
        return Response(TaskDetailSerializer(task, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        status_id = request.data.get("status_id")
        task_ids = request.data.get("task_ids")
        if not status_id or not isinstance(task_ids, list):
            raise ValidationError({"detail": "status_id and an ordered task_ids list are required."})
        target_status = TaskStatus.objects.select_related("project", "project__workspace").filter(pk=status_id).first()
        if not target_status or not can_contribute_to_project(request.user, target_status.project):
            raise PermissionDenied("You cannot reorder tasks in this status.")
        tasks = list(self.get_queryset().filter(pk__in=task_ids))
        if len(tasks) != len(set(task_ids)) or any(task.project_id != target_status.project_id for task in tasks):
            raise ValidationError("Every task must be visible and belong to this project.")
        by_id = {task.id: task for task in tasks}
        with transaction.atomic():
            for position, task_id in enumerate(task_ids):
                task = by_id[int(task_id)]
                task.status = target_status
                task.position = position
                task.completed_at = timezone.now() if target_status.is_done else None
                task.save(update_fields=["status", "position", "completed_at", "updated_at"])
        return Response({"updated": len(task_ids)})

    @action(detail=False, methods=["get"], url_path="next-upcoming")
    def next_upcoming(self, request):
        task = (
            self.get_queryset()
            .filter(Q(assignees=request.user) | Q(created_by=request.user), start_time__gte=timezone.now())
            .exclude(status__category=TaskStatus.Category.DONE)
            .order_by("start_time", "created_at")
            .first()
        )
        return Response({"task": TaskSerializer(task).data if task else None})

    @action(detail=False, methods=["get"], url_path="my-tasks")
    def my_tasks(self, request):
        queryset = self.get_queryset().filter(Q(assignees=request.user) | Q(created_by=request.user)).distinct()
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(TaskSerializer(page, many=True).data)
        return Response(TaskSerializer(queryset, many=True).data)


class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get_queryset(self):
        return ChecklistItem.objects.filter(task__project__in=visible_projects(self.request.user)).select_related("task", "created_by")

    def _ensure_contributor(self, item_or_task):
        task = item_or_task.task if isinstance(item_or_task, ChecklistItem) else item_or_task
        if not can_contribute_to_project(self.request.user, task.project):
            raise PermissionDenied("Viewer access does not allow checklist changes.")

    def perform_create(self, serializer):
        task = serializer.validated_data["task"]
        self._ensure_contributor(task)
        position = serializer.validated_data.get("position")
        if position is None:
            position = (ChecklistItem.objects.filter(task=task).aggregate(last=Max("position"))["last"] or -1) + 1
        item = serializer.save(created_by=self.request.user, position=position)
        TaskActivity.objects.create(task=task, actor=self.request.user, action=TaskActivity.Action.CHECKLIST_UPDATED, metadata={"item": item.content})

    def perform_update(self, serializer):
        self._ensure_contributor(serializer.instance)
        is_completed = serializer.validated_data.get("is_completed", serializer.instance.is_completed)
        item = serializer.save(completed_at=timezone.now() if is_completed else None)
        TaskActivity.objects.create(task=item.task, actor=self.request.user, action=TaskActivity.Action.CHECKLIST_UPDATED, metadata={"item": item.content, "completed": item.is_completed})

    def perform_destroy(self, instance):
        self._ensure_contributor(instance)
        task = instance.task
        content = instance.content
        instance.delete()
        TaskActivity.objects.create(task=task, actor=self.request.user, action=TaskActivity.Action.CHECKLIST_UPDATED, metadata={"removed": content})


class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get_queryset(self):
        queryset = TaskComment.objects.filter(task__project__in=visible_projects(self.request.user)).select_related("task", "task__project", "author").prefetch_related("mentions")
        task_id = self.request.query_params.get("task")
        return queryset.filter(task_id=task_id) if task_id else queryset

    def _ensure_contributor(self, task):
        if not can_contribute_to_project(self.request.user, task.project):
            raise PermissionDenied("Viewer access does not allow comments.")

    def perform_create(self, serializer):
        task = serializer.validated_data["task"]
        self._ensure_contributor(task)
        mentions = serializer.validated_data.get("mentions", [])
        invalid_mentions = [user.id for user in mentions if not WorkspaceMembership.objects.filter(workspace=task.project.workspace, user=user).exists()]
        if invalid_mentions:
            raise ValidationError({"mention_ids": "Mentioned people must be workspace members."})
        comment = serializer.save(author=self.request.user)
        TaskActivity.objects.create(task=task, actor=self.request.user, action=TaskActivity.Action.COMMENTED, metadata={"comment_id": comment.id})
        Notification.objects.bulk_create(
            [
                Notification(
                    user=user,
                    task=task,
                    notification_type=Notification.NotificationType.SYSTEM,
                    message=f"{request_user.name if (request_user := self.request.user) else 'A teammate'} mentioned you on '{task.title}'.",
                )
                for user in mentions
                if user.id != self.request.user.id
            ]
        )

    def perform_update(self, serializer):
        comment = serializer.instance
        self._ensure_contributor(comment.task)
        if comment.author_id != self.request.user.id and not can_manage_project(self.request.user, comment.task.project):
            raise PermissionDenied("Only the author or a project administrator can edit a comment.")
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_contributor(instance.task)
        if instance.author_id != self.request.user.id and not can_manage_project(self.request.user, instance.task.project):
            raise PermissionDenied("Only the author or a project administrator can delete a comment.")
        instance.delete()
