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
    UserSerializer,
)
from .services import log_failed_login, verify_google_id_token
from apps.monitoring.models import SecurityLog


class EmailAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = EmailAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            log_failed_login(
                ip_address=request.META.get("REMOTE_ADDR", ""),
                path=request.path,
                metadata={"reason": "email_not_registered", "email": email},
            )
            return Response(
                {"detail": "No account found. Create account with Google below."},
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

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


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

            refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


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
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
