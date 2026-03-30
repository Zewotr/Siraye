from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
    message = "Please verify your email before using this feature."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin":
            return True
        return user.email_verified
