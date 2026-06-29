"""
ASGI config for SoroScan project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "soroscan.settings")

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing code that may rely on Django models
django_asgi_app = get_asgi_application()

# Import after Django initialization to avoid AppRegistry errors
from soroscan.ingest.routing import websocket_urlpatterns  # noqa: E402
from soroscan.ingest.schema import schema  # noqa: E402
from soroscan.subscription_middleware import (  # noqa: E402
    SubscriptionRateLimitMiddleware,
)
from strawberry.channels import GraphQLWSConsumer  # noqa: E402

# Create the GraphQL WebSocket consumer with rate limiting
graphql_ws_consumer = SubscriptionRateLimitMiddleware(
    GraphQLWSConsumer.as_asgi(schema=schema)
)

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    [
                        path("graphql/", graphql_ws_consumer),
                        *websocket_urlpatterns,
                    ]
                )
            )
        ),
    }
)

from soroscan.shutdown import register_shutdown_handlers  # noqa: E402

register_shutdown_handlers()
