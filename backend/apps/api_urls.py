from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.common.views import ApiRootView, HealthCheckView

urlpatterns = [
    path("", ApiRootView.as_view(), name="api-root"),
    path("health", HealthCheckView.as_view(), name="health-check"),
    path("", include("apps.accounts.urls")),
    path("", include("apps.tasks.urls")),
    path("", include("apps.notifications.urls")),
    path("", include("apps.adminpanel.urls")),
    path("auth/token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
]
