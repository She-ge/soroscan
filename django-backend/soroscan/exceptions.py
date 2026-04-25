from rest_framework.views import exception_handler
from .log_context import get_log_extra

def custom_exception_handler(exc, context):
    """
    Centralized error handler for REST framework to append the request_id
    to all error payloads.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Append request_id to the error response
    print(f"DEBUG: custom_exception_handler called with {response.data if response else None}")
    if response is not None and isinstance(response.data, dict):
        request = context.get('request')
        print(f"DEBUG: request = {request}, hasattr request_id: {hasattr(request, 'request_id')}")
        if request and hasattr(request, 'request_id'):
            print(f"DEBUG: injecting request_id: {request.request_id}")
            response.data["request_id"] = request.request_id

    return response
