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
                },
            }
        )


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})
