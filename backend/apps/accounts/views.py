from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.common.permissions import IsActiveAndNotBanned

from .models import User
from .serializers import (
    EmailAuthSerializer,
    GoogleAuthSerializer,
    LogoutSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .services import log_failed_login, verify_google_id_token
from apps.monitoring.models import SecurityLog


def _issue_tokens(user):
    """Return JWT access + refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


class RegisterView(APIView):
    """Sign up with name + email + password."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        with transaction.atomic():
            user = User.objects.create_user(
                email=data["email"],
                password=data["password"],
                name=data["name"],
            )

            # Auto-provision default workspace for user
            try:
                from apps.tasks.models import Workspace, WorkspaceMembership
                from apps.tasks.views import unique_workspace_slug

                workspace_name = f"{user.name}'s Workspace"
                workspace = Workspace.objects.create(
                    owner=user,
                    name=workspace_name,
                    slug=unique_workspace_slug(f"{user.name}-workspace"),
                    color="#255a54",
                )
                WorkspaceMembership.objects.create(
                    workspace=workspace,
                    user=user,
                    role=WorkspaceMembership.Role.OWNER,
                )
            except Exception:
                pass

        return Response(_issue_tokens(user), status=status.HTTP_201_CREATED)


class EmailAuthView(APIView):
    """Login with name or email + password."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = EmailAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            # Check by user's display name
            candidates = User.objects.filter(name__iexact=identifier)
            for candidate in candidates:
                if candidate.check_password(password):
                    user = candidate
                    break
            if not user and candidates.exists():
                user = candidates.first()

        if not user:
            log_failed_login(
                ip_address=request.META.get("REMOTE_ADDR", ""),
                path=request.path,
                metadata={"reason": "user_not_found", "identifier": identifier},
            )
            return Response(
                {"detail": "No account found with this name or email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"detail": "This account is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.is_banned:
            SecurityLog.objects.create(
                user=user,
                event_type=SecurityLog.EventType.FORBIDDEN,
                ip_address=request.META.get("REMOTE_ADDR", ""),
                path=request.path,
                method=request.method,
                metadata={"reason": "banned_login_attempt"},
            )
            return Response(
                {"detail": "Your account has been suspended."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.check_password(password):
            log_failed_login(
                ip_address=request.META.get("REMOTE_ADDR", ""),
                path=request.path,
                metadata={"reason": "wrong_password", "identifier": identifier},
            )
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(_issue_tokens(user), status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = verify_google_id_token(serializer.validated_data["id_token"])
        except ValueError as exc:
            log_failed_login(
                ip_address=request.META.get("REMOTE_ADDR", ""),
                path=request.path,
                metadata={"reason": str(exc)},
            )
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        email = payload["email"].lower()
        name = payload.get("name") or email.split("@")[0]
        picture = payload.get("picture", "")

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": name,
                    "profile_picture": picture,
                },
            )

            if not user.is_active:
                return Response(
                    {"detail": "This account is inactive."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if user.is_banned:
                SecurityLog.objects.create(
                    user=user,
                    event_type=SecurityLog.EventType.FORBIDDEN,
                    ip_address=request.META.get("REMOTE_ADDR", ""),
                    path=request.path,
                    method=request.method,
                    metadata={"reason": "banned_login_attempt"},
                )
                return Response(
                    {"detail": "Your account has been suspended."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not created:
                updates = []
                if picture and user.profile_picture != picture:
                    user.profile_picture = picture
                    updates.append("profile_picture")
                if name and user.name != name:
                    user.name = name
                    updates.append("name")
                if updates:
                    user.save(update_fields=updates)
            else:
                user.set_unusable_password()
                user.save(update_fields=["password"])
                try:
                    from apps.tasks.models import Workspace, WorkspaceMembership
                    from apps.tasks.views import unique_workspace_slug

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
                except Exception:
                    pass

        return Response(_issue_tokens(user), status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if "accent_color" in serializer.validated_data:
            try:
                from apps.tasks.models import Workspace
                Workspace.objects.filter(owner=user).update(color=serializer.validated_data["accent_color"])
            except Exception:
                pass
        return Response(UserSerializer(user).data)

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def post(self, request):
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")
        confirm_password = request.data.get("confirm_password", "")

        if not current_password or not new_password:
            return Response(
                {"detail": "Both current password and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "New passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=request.user)
        except Exception as exc:
            messages = exc.messages if hasattr(exc, "messages") else [str(exc)]
            return Response(
                {"detail": messages[0] if messages else "Invalid password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save()
        return Response({"detail": "Password successfully updated."}, status=status.HTTP_200_OK)


class OnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsActiveAndNotBanned]

    def post(self, request):
        from .serializers import OnboardingSerializer

        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        job_type = serializer.validated_data["job_type"]
        accent_color = serializer.validated_data.get("accent_color", "#255A54")
        theme = serializer.validated_data.get("theme_preference", "system")
        primary_goal = serializer.validated_data.get("primary_goal", "")

        user.job_type = job_type
        user.accent_color = accent_color
        user.theme_preference = theme
        user.onboarding_completed = True
        user.save(update_fields=["job_type", "accent_color", "theme_preference", "onboarding_completed", "updated_at"])

        # Customize user's primary owned workspace with their chosen accent color
        try:
            from apps.tasks.models import Workspace

            workspace = Workspace.objects.filter(owner=user).first()
            if workspace:
                workspace.color = accent_color
                workspace.save(update_fields=["color"])
        except Exception:
            pass

        # Log analytics
        SecurityLog.objects.create(
            user=user,
            event_type=SecurityLog.EventType.ONBOARDING,
            ip_address=request.META.get("REMOTE_ADDR", ""),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            path=request.path,
            method=request.method,
            metadata={
                "job_type": job_type,
                "accent_color": accent_color,
                "theme_preference": theme,
                "primary_goal": primary_goal,
            },
        )

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


