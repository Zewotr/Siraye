from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = "Admin privileges are required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin":
            return True
        owner_id = getattr(obj, "user_id", None) or getattr(obj, "id", None)
        return owner_id == user.id


class IsActiveAndNotBanned(BasePermission):
    message = "Your account has been suspended."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return True
        return user.is_active and not user.is_banned
