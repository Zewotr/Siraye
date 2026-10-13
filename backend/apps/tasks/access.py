from django.db.models import Q

from .models import Project, ProjectMembership, WorkspaceMembership


MANAGER_ROLES = {WorkspaceMembership.Role.OWNER, WorkspaceMembership.Role.ADMIN}
CONTRIBUTOR_ROLES = MANAGER_ROLES | {WorkspaceMembership.Role.MEMBER}


def visible_projects(user):
    """Projects the user can see through a project role or workspace administration."""
    if user.role == "admin":
        return Project.objects.all()
    return Project.objects.filter(
        Q(memberships__user=user)
        | Q(
            workspace__memberships__user=user,
            workspace__memberships__role__in=MANAGER_ROLES,
        )
    ).distinct()


def workspace_role(user, workspace):
    if user.role == "admin":
        return WorkspaceMembership.Role.ADMIN
    return WorkspaceMembership.objects.filter(workspace=workspace, user=user).values_list("role", flat=True).first()


def project_role(user, project):
    if user.role == "admin":
        return ProjectMembership.Role.ADMIN
    workspace_member_role = workspace_role(user, project.workspace)
    if workspace_member_role in MANAGER_ROLES:
        return workspace_member_role
    return ProjectMembership.objects.filter(project=project, user=user).values_list("role", flat=True).first()


def can_view_project(user, project):
    return bool(project_role(user, project))


def can_contribute_to_project(user, project):
    return project_role(user, project) in CONTRIBUTOR_ROLES


def can_manage_project(user, project):
    return project_role(user, project) in MANAGER_ROLES


def can_manage_workspace(user, workspace):
    return workspace_role(user, workspace) in MANAGER_ROLES
