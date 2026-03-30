from django.urls import path

from .views import (
    AdminBackupView,
    AdminSecurityLogListView,
    AdminStorageView,
    AdminSystemStatsView,
    AdminUserBanView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserUnbanView,
)

urlpatterns = [
    path("admin/users", AdminUserListView.as_view(), name="admin-users-list"),
    path("admin/users/<int:id>", AdminUserDetailView.as_view(), name="admin-users-detail"),
    path("admin/users/<int:id>/ban", AdminUserBanView.as_view(), name="admin-users-ban"),
    path("admin/users/<int:id>/unban", AdminUserUnbanView.as_view(), name="admin-users-unban"),
    path("admin/security-logs", AdminSecurityLogListView.as_view(), name="admin-security-logs"),
    path("admin/system-stats", AdminSystemStatsView.as_view(), name="admin-system-stats"),
    path("admin/storage", AdminStorageView.as_view(), name="admin-storage"),
    path("admin/backups", AdminBackupView.as_view(), name="admin-backups"),
]
