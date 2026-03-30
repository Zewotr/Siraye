from django.apps import apps


class SecurityAuditMiddleware:
    """Capture security-relevant responses for admin monitoring."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.path.startswith("/api/") and response.status_code in {401, 403, 429}:
            SecurityLog = apps.get_model("monitoring", "SecurityLog")
            user = request.user if request.user.is_authenticated else None
            event_type = {
                401: SecurityLog.EventType.UNAUTHORIZED,
                403: SecurityLog.EventType.FORBIDDEN,
                429: SecurityLog.EventType.RATE_LIMIT,
            }[response.status_code]
            SecurityLog.objects.create(
                user=user,
                event_type=event_type,
                ip_address=request.META.get("REMOTE_ADDR", ""),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                path=request.path,
                method=request.method,
                metadata={"status_code": response.status_code},
            )

        return response
