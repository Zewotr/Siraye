from django.contrib import admin
from django.urls import include, path

from apps.common.views import ApiRootView

urlpatterns = [
    path("", ApiRootView.as_view(), name="root"),
    path("django-admin/", admin.site.urls),
    path("api", ApiRootView.as_view(), name="api-root-no-slash"),
    path("api/", include("apps.api_urls")),
]
