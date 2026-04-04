from django.urls import path

from .views import (
    EmailAuthView,
    GoogleAuthView,
    LogoutView,
    MeView,
    ProfileView,
    ResendVerificationView,
    VerifyEmailView,
)

urlpatterns = [
    path("auth/email-login", EmailAuthView.as_view(), name="auth-email-login"),
    path("auth/google", GoogleAuthView.as_view(), name="auth-google"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("auth/verify-email", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("auth/resend-verification", ResendVerificationView.as_view(), name="auth-resend-verification"),
    path("profile", ProfileView.as_view(), name="profile"),
]
