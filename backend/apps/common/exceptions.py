from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {"detail": "An unexpected error occurred."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        response.data = {
            "detail": "Rate limit exceeded. Please try again later.",
            "code": "rate_limited",
        }
    return response
