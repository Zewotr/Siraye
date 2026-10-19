from rest_framework import serializers

from apps.accounts.models import User

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


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "profile_picture"]


class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all(), write_only=True)

    class Meta:
        model = WorkspaceMembership
        fields = ["id", "user", "user_id", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSummarySerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True, default=0)
    project_count = serializers.IntegerField(read_only=True, default=0)
    current_role = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "color",
            "owner",
            "member_count",
            "project_count",
            "current_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "member_count", "project_count", "current_role", "created_at", "updated_at"]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all(), write_only=True)

    class Meta:
        model = ProjectMembership
        fields = ["id", "user", "user_id", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = ["id", "name", "key", "color", "category", "position"]
        read_only_fields = ["id"]


class ProjectSerializer(serializers.ModelSerializer):
    workspace_name = serializers.CharField(source="workspace.name", read_only=True)
    member_count = serializers.IntegerField(read_only=True, default=0)
    task_count = serializers.IntegerField(read_only=True, default=0)
    current_role = serializers.CharField(read_only=True, allow_null=True)
    statuses = TaskStatusSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "name",
            "key",
            "description",
            "icon",
            "color",
            "is_archived",
            "member_count",
            "task_count",
            "current_role",
            "statuses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace_name", "member_count", "task_count", "current_role", "statuses", "created_at", "updated_at"]


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ["id", "workspace", "name", "color", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChecklistItemSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = ChecklistItem
        fields = [
            "id",
            "task",
            "content",
            "is_completed",
            "position",
            "completed_at",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "completed_at", "created_by", "created_at", "updated_at"]


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    mentions = UserSummarySerializer(many=True, read_only=True)
    mention_ids = serializers.PrimaryKeyRelatedField(
        source="mentions",
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = TaskComment
        fields = ["id", "task", "body", "author", "mentions", "mention_ids", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "mentions", "created_at", "updated_at"]


class TaskActivitySerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)

    class Meta:
        model = TaskActivity
        fields = ["id", "action", "metadata", "actor", "created_at"]
        read_only_fields = fields


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    workspace_id = serializers.IntegerField(source="project.workspace_id", read_only=True)
    created_by = UserSummarySerializer(read_only=True)
    status = TaskStatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(source="status", queryset=TaskStatus.objects.all(), write_only=True, required=False)
    assignees = UserSummarySerializer(many=True, read_only=True)
    assignee_ids = serializers.PrimaryKeyRelatedField(
        source="assignees",
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    labels = LabelSerializer(many=True, read_only=True)
    label_ids = serializers.PrimaryKeyRelatedField(
        source="labels",
        queryset=Label.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    checklist_total = serializers.SerializerMethodField()
    checklist_completed = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "project_name",
            "workspace_id",
            "title",
            "description",
            "priority",
            "status",
            "status_id",
            "assignees",
            "assignee_ids",
            "labels",
            "label_ids",
            "due_date",
            "start_time",
            "end_time",
            "position",
            "completed_at",
            "created_by",
            "checklist_total",
            "checklist_completed",
            "comments_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "completed_at",
            "created_by",
            "checklist_total",
            "checklist_completed",
            "comments_count",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        project = attrs.get("project") or getattr(self.instance, "project", None)
        status = attrs.get("status") or getattr(self.instance, "status", None)
        start_time = attrs.get("start_time") if "start_time" in attrs else getattr(self.instance, "start_time", None)
        end_time = attrs.get("end_time") if "end_time" in attrs else getattr(self.instance, "end_time", None)

        if not project:
            raise serializers.ValidationError({"project": "A project is required."})
        if not status:
            raise serializers.ValidationError({"status_id": "A status is required."})
        if status.project_id != project.id:
            raise serializers.ValidationError({"status_id": "The status must belong to the selected project."})
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({"end_time": "End time must be later than start time."})

        labels = attrs.get("labels")
        if labels and any(label.workspace_id != project.workspace_id for label in labels):
            raise serializers.ValidationError({"label_ids": "Labels must belong to the project's workspace."})

        assignees = attrs.get("assignees")
        if assignees:
            member_ids = set(
                WorkspaceMembership.objects.filter(workspace=project.workspace, user__in=assignees).values_list("user_id", flat=True)
            )
            if member_ids != {user.id for user in assignees}:
                raise serializers.ValidationError({"assignee_ids": "Assignees must be workspace members."})
        return attrs

    def get_checklist_total(self, obj):
        return len(obj.checklist_items.all()) if hasattr(obj, "_prefetched_objects_cache") else obj.checklist_items.count()

    def get_checklist_completed(self, obj):
        items = obj.checklist_items.all()
        return sum(item.is_completed for item in items) if hasattr(obj, "_prefetched_objects_cache") else items.filter(is_completed=True).count()

    def get_comments_count(self, obj):
        return len(obj.comments.all()) if hasattr(obj, "_prefetched_objects_cache") else obj.comments.count()


class TaskDetailSerializer(TaskSerializer):
    checklist_items = ChecklistItemSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    activity = TaskActivitySerializer(many=True, read_only=True)

    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ["checklist_items", "comments", "activity"]
