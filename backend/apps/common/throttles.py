from django.apps import apps
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle


class AuditScopedRateThrottle(ScopedRateThrottle):
    def allow_request(self, request, view):
        self._request = request
        return super().allow_request(request, view)

    def throttle_failure(self):
        self._log_event()
        return super().throttle_failure()

    def _log_event(self):
        SecurityLog = apps.get_model("monitoring", "SecurityLog")
        request = getattr(self, "_request", None)
        if request is None:
            return
        user = request.user if request.user.is_authenticated else None
        SecurityLog.objects.create(
            user=user,
            event_type=SecurityLog.EventType.RATE_LIMIT,
            ip_address=self.get_ident(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            path=request.path,
            method=request.method,
            metadata={"scope": self.scope, "detail": "scope throttle exceeded"},
        )


class AuditUserRateThrottle(UserRateThrottle):
    def allow_request(self, request, view):
        self._request = request
        return super().allow_request(request, view)

    def throttle_failure(self):
        self._log_event("user")
        return super().throttle_failure()

    def _log_event(self, scope: str):
        SecurityLog = apps.get_model("monitoring", "SecurityLog")
        request = getattr(self, "_request", None)
        if request is None:
            return
        user = request.user if request.user.is_authenticated else None
        SecurityLog.objects.create(
            user=user,
            event_type=SecurityLog.EventType.RATE_LIMIT,
            ip_address=self.get_ident(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            path=request.path,
            method=request.method,
            metadata={"scope": scope, "detail": "user throttle exceeded"},
        )


class AuditAnonRateThrottle(AnonRateThrottle):
    def allow_request(self, request, view):
        self._request = request
        return super().allow_request(request, view)

    def throttle_failure(self):
        self._log_event("anon")
        return super().throttle_failure()

    def _log_event(self, scope: str):
        SecurityLog = apps.get_model("monitoring", "SecurityLog")
        request = getattr(self, "_request", None)
        if request is None:
            return
        SecurityLog.objects.create(
            event_type=SecurityLog.EventType.RATE_LIMIT,
            ip_address=self.get_ident(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            path=request.path,
            method=request.method,
            metadata={"scope": scope, "detail": "anonymous throttle exceeded"},
        )
