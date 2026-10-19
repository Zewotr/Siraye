from django.urls import path

from .views import (
    ChangePasswordView,
    EmailAuthView,
    GoogleAuthView,
    LogoutView,
    MeView,
    OnboardingView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", EmailAuthView.as_view(), name="auth-login"),
    # Keep legacy path as alias so existing clients don't break
    path("auth/email-login", EmailAuthView.as_view(), name="auth-email-login"),
    path("auth/google", GoogleAuthView.as_view(), name="auth-google"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("profile/change-password", ChangePasswordView.as_view(), name="profile-change-password"),
    path("accounts/onboarding", OnboardingView.as_view(), name="accounts-onboarding"),
    path("onboarding", OnboardingView.as_view(), name="onboarding"),
]
