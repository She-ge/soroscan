"""
Integration tests for GraphQL subscription support.
"""

import asyncio

import pytest
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from strawberry.channels import GraphQLWSConsumer

from soroscan.ingest.models import ContractEvent, TrackedContract
from soroscan.ingest.schema import schema
from soroscan.subscription_middleware import SubscriptionRateLimitMiddleware

User = get_user_model()
GRAPHQL_WS_SUBPROTOCOLS = ["graphql-transport-ws"]


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
class TestGraphQLSubscriptions:
    """Test GraphQL subscription functionality for real-time event streaming."""

    async def test_subscription_receives_event(self):
        """Test that subscription receives events published to channel layer."""
        # Create test contract and user
        user = await self._create_user()
        contract = await self._create_contract(user)

        # Create communicator for WebSocket connection
        application = GraphQLWSConsumer.as_asgi(schema=schema)
        communicator = WebsocketCommunicator(
            application,
            "/graphql/",
            subprotocols=GRAPHQL_WS_SUBPROTOCOLS,
        )

        connected, _ = await communicator.connect()
        assert connected, "WebSocket connection failed"

        try:
            # Send connection_init message (graphql-ws protocol)
            await communicator.send_json_to(
                {
                    "type": "connection_init",
                }
            )

            # Receive connection_ack
            response = await communicator.receive_json_from(timeout=5)
            assert response["type"] == "connection_ack"

            # Subscribe to contract events
            subscription_query = """
                subscription {
                    contractEvents(contractId: "%s") {
                        id
                        eventType
                        ledger
                        timestamp
                    }
                }
            """ % contract.contract_id

            await communicator.send_json_to(
                {
                    "id": "1",
                    "type": "subscribe",
                    "payload": {
                        "query": subscription_query,
                    },
                }
            )

            # Wait a moment for subscription to be registered
            await asyncio.sleep(0.5)

            # Create an event in the database
            event = await self._create_event(contract)

            # Publish event to channel layer (simulating what tasks.py does)
            channel_layer = get_channel_layer()
            await channel_layer.group_send(
                f"events_{contract.contract_id}",
                {
                    "type": "contract_event",
                    "data": {
                        "contract_id": contract.contract_id,
                        "event_type": event.event_type,
                        "ledger": event.ledger,
                        "event_index": event.event_index,
                        "tx_hash": event.tx_hash,
                        "payload": event.payload,
                        "timestamp": event.timestamp.isoformat(),
                    },
                },
            )

            # Receive the event through subscription
            response = await communicator.receive_json_from(timeout=5)
            assert response["type"] == "next"
            assert response["id"] == "1"

            # Verify payload contains event data
            payload = response["payload"]
            assert "data" in payload
            assert "contractEvents" in payload["data"]

            event_data = payload["data"]["contractEvents"]
            assert event_data["eventType"] == event.event_type
            assert event_data["ledger"] == event.ledger

        finally:
            await communicator.disconnect()

    async def test_subscription_cleanup_on_disconnect(self):
        """Test that channel group membership is cleaned up on disconnect."""
        user = await self._create_user()
        contract = await self._create_contract(user)

        application = GraphQLWSConsumer.as_asgi(schema=schema)
        communicator = WebsocketCommunicator(
            application,
            "/graphql/",
            subprotocols=GRAPHQL_WS_SUBPROTOCOLS,
        )

        connected, _ = await communicator.connect()
        assert connected

        try:
            # Initialize connection
            await communicator.send_json_to({"type": "connection_init"})
            await communicator.receive_json_from(timeout=5)

            # Subscribe
            subscription_query = """
                subscription {
                    contractEvents(contractId: "%s") {
                        id
                        eventType
                    }
                }
            """ % contract.contract_id

            await communicator.send_json_to(
                {
                    "id": "1",
                    "type": "subscribe",
                    "payload": {"query": subscription_query},
                }
            )

            await asyncio.sleep(0.5)

        finally:
            # Disconnect
            await communicator.disconnect()

        # Verify cleanup: sending to group should not raise error
        channel_layer = get_channel_layer()
        try:
            await channel_layer.group_send(
                f"events_{contract.contract_id}",
                {
                    "type": "contract_event",
                    "data": {"test": "cleanup"},
                },
            )
            # If no exception, cleanup was successful
        except Exception as e:
            pytest.fail(f"Channel group send failed after disconnect: {e}")

    async def test_rate_limiting_max_subscriptions(self):
        """Test that rate limiting prevents more than 5 concurrent subscriptions per IP."""
        # Reset rate limit tracking
        SubscriptionRateLimitMiddleware._active_subscriptions.clear()

        application = SubscriptionRateLimitMiddleware(
            GraphQLWSConsumer.as_asgi(schema=schema)
        )

        communicators = []

        try:
            # Open 5 connections successfully
            for i in range(5):
                communicator = WebsocketCommunicator(
                    application,
                    "/graphql/",
                    headers=[(b"x-forwarded-for", b"192.168.1.100")],
                    subprotocols=GRAPHQL_WS_SUBPROTOCOLS,
                )
                connected, _ = await communicator.connect()
                assert connected, f"Connection {i+1} should succeed"
                communicators.append(communicator)

                # Initialize each connection
                await communicator.send_json_to({"type": "connection_init"})
                await communicator.receive_json_from(timeout=5)

            # 6th connection should be rate limited
            extra_communicator = WebsocketCommunicator(
                application,
                "/graphql/",
                headers=[(b"x-forwarded-for", b"192.168.1.100")],
                subprotocols=GRAPHQL_WS_SUBPROTOCOLS,
            )
            connected, _ = await extra_communicator.connect()

            # Should be rejected (connection closes immediately)
            assert not connected, "6th connection should be rate limited"

        finally:
            # Clean up all connections
            for comm in communicators:
                await comm.disconnect()

    async def test_http_graphql_queries_still_work(self):
        """Test that existing HTTP GraphQL queries are not affected."""
        from channels.db import database_sync_to_async

        user = await self._create_user()
        await self._create_contract(user)

        # Test a simple query using schema.execute_sync wrapped in async
        query = """
            query {
                contracts {
                    id
                    contractId
                    name
                }
            }
        """

        @database_sync_to_async
        def execute_query():
            result = schema.execute_sync(query)
            return result

        result = await execute_query()
        assert result.errors is None
        assert "contracts" in result.data
        assert len(result.data["contracts"]) > 0

    async def test_subscription_with_multiple_events(self):
        """Test subscription receives multiple events in sequence."""
        user = await self._create_user()
        contract = await self._create_contract(user)

        application = GraphQLWSConsumer.as_asgi(schema=schema)
        communicator = WebsocketCommunicator(
            application,
            "/graphql/",
            subprotocols=GRAPHQL_WS_SUBPROTOCOLS,
        )

        connected, _ = await communicator.connect()
        assert connected

        try:
            # Initialize
            await communicator.send_json_to({"type": "connection_init"})
            await communicator.receive_json_from(timeout=5)

            # Subscribe
            subscription_query = """
                subscription {
                    contractEvents(contractId: "%s") {
                        id
                        eventType
                        ledger
                    }
                }
            """ % contract.contract_id

            await communicator.send_json_to(
                {
                    "id": "1",
                    "type": "subscribe",
                    "payload": {"query": subscription_query},
                }
            )

            await asyncio.sleep(0.5)

            # Create and publish 3 events
            channel_layer = get_channel_layer()
            event_types = ["transfer", "mint", "burn"]

            for idx, event_type in enumerate(event_types):
                event = await self._create_event(
                    contract, event_type=event_type, ledger=1000 + idx
                )

                await channel_layer.group_send(
                    f"events_{contract.contract_id}",
                    {
                        "type": "contract_event",
                        "data": {
                            "contract_id": contract.contract_id,
                            "event_type": event.event_type,
                            "ledger": event.ledger,
                            "event_index": event.event_index,
                            "tx_hash": event.tx_hash,
                            "payload": event.payload,
                            "timestamp": event.timestamp.isoformat(),
                        },
                    },
                )

                # Receive each event
                response = await communicator.receive_json_from(timeout=5)
                assert response["type"] == "next"
                event_data = response["payload"]["data"]["contractEvents"]
                assert event_data["eventType"] == event_type
                assert event_data["ledger"] == 1000 + idx

        finally:
            await communicator.disconnect()

    # Helper methods
    @staticmethod
    async def _create_user():
        """Create a test user asynchronously."""
        from channels.db import database_sync_to_async
        import time

        @database_sync_to_async
        def create():
            return User.objects.create_user(
                username=f"test-user-{int(time.time() * 1000000)}",
                password="testpass123",
            )

        return await create()

    @staticmethod
    async def _create_contract(user):
        """Create a test contract asynchronously."""
        from channels.db import database_sync_to_async
        import time

        @database_sync_to_async
        def create():
            return TrackedContract.objects.create(
                contract_id=f"C{'a' * 55}{int(time.time() * 1000000)}",
                name="Test Contract",
                description="Test Description",
                owner=user,
                is_active=True,
            )

        return await create()

    @staticmethod
    async def _create_event(contract, event_type="transfer", ledger=1000):
        """Create a test event asynchronously."""
        from channels.db import database_sync_to_async
        from django.utils import timezone

        @database_sync_to_async
        def create():
            return ContractEvent.objects.create(
                contract=contract,
                event_type=event_type,
                ledger=ledger,
                event_index=0,
                tx_hash=f"tx-{ledger}",
                payload={"amount": 100},
                timestamp=timezone.now(),
            )

        return await create()
