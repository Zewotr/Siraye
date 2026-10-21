import time
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class ApiRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "name": "Siraye API",
                "status": "ok",
                "endpoints": {
                    "health": "/api/health",
                    "auth_google": "/api/auth/google",
                    "auth_me": "/api/auth/me",
                    "workspaces": "/api/workspaces",
                    "projects": "/api/projects",
                    "tasks": "/api/tasks",
                    "my_tasks": "/api/tasks/my-tasks",
                },
            }
        )


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Database ping & type detection
        db_start = time.perf_counter()
        db_connected = False
        db_type = "PostgreSQL"
        db_ssl = False
        db_error = None

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            db_connected = True
            db_ms = round((time.perf_counter() - db_start) * 1000, 2)

            db_settings = connection.settings_dict
            host = (db_settings.get("HOST") or "").lower()
            if "neon.tech" in host:
                db_type = "Neon Serverless PostgreSQL"
            elif "supabase.co" in host or "supabase.com" in host:
                db_type = "Supabase Managed PostgreSQL"
            elif host in ["postgres", "localhost", "127.0.0.1", ""]:
                db_type = "PostgreSQL Container / Local"
            else:
                db_type = f"PostgreSQL Cloud ({host})"

            db_ssl = bool(db_settings.get("OPTIONS", {}).get("sslmode") in ["require", "verify-full", "verify-ca"])
        except Exception as exc:
            db_error = str(exc)
            db_ms = -1

        # Redis Cache Ping
        cache_start = time.perf_counter()
        cache_connected = False
        try:
            cache.set("siraye:health:ping", "pong", 5)
            cache_connected = (cache.get("siraye:health:ping") == "pong")
            cache_ms = round((time.perf_counter() - cache_start) * 1000, 2)
        except Exception:
            cache_ms = -1

        # Supabase Storage configuration
        supabase_configured = bool(getattr(settings, "SUPABASE_URL", "") and getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", ""))

        # Google OAuth status
        google_client_id = (getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or "").strip()
        google_auth_ready = bool(google_client_id and "your-google" not in google_client_id)

        # MongoDB configuration
        mongodb_uri = getattr(settings, "MONGODB_URI", "")
        mongodb_configured = bool(mongodb_uri and "mongodb" in mongodb_uri)

        return Response(
            {
                "status": "healthy" if db_connected else "degraded",
                "database": {
                    "connected": db_connected,
                    "provider": db_type,
                    "engine": "django.db.backends.postgresql",
                    "ssl_enabled": db_ssl,
                    "latency_ms": db_ms,
                    "error": db_error,
                },
                "cache": {
                    "connected": cache_connected,
                    "backend": "django-redis",
                    "latency_ms": cache_ms,
                },
                "cloud_integrations": {
                    "supabase_storage": {
                        "configured": supabase_configured,
                        "storage_bucket": getattr(settings, "SUPABASE_STORAGE_BUCKET", "siraye-assets"),
                    },
                    "google_oauth": {
                        "configured": google_auth_ready,
                        "client_id_set": bool(google_client_id),
                        "testing_fallback_active": True,
                    },
                    "mongodb": {
                        "configured": mongodb_configured,
                    },
                },
            }
        )
