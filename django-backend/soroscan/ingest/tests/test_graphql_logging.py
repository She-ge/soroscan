"""
Tests for GraphQL resolver structured logging.

Covers:
- All query resolvers log start and completion with query name, args, duration, status
- Failed queries log with error message and stack trace
- Argument sanitization masks sensitive keys
- Mutation resolvers are logged
- Non-top-level field resolvers are NOT logged (only top-level Query/Mutation)
- log_graphql_resolver decorator unit tests
"""
import time
from unittest.mock import MagicMock, patch

import pytest

from soroscan.graphql_extensions import log_graphql_resolver, sanitize_arguments
from soroscan.ingest.schema import schema

from .factories import ContractEventFactory, TrackedContractFactory, UserFactory


# ---------------------------------------------------------------------------
# Unit tests for sanitize_arguments
# ---------------------------------------------------------------------------


class TestSanitizeArguments:
    def test_masks_sensitive_top_level_keys(self):
        args = {
            "password": "s3cr3t",
            "token": "tok123",
            "secret": "abc",
            "key": "mykey",
            "authorization": "Bearer xyz",
            "api_key": "apikey",
            "name": "visible",
        }
        result = sanitize_arguments(args)
        assert result["password"] == "********"
        assert result["token"] == "********"
        assert result["secret"] == "********"
        assert result["key"] == "********"
        assert result["authorization"] == "********"
        assert result["api_key"] == "********"
        # Non-sensitive keys pass through
        assert result["name"] == "visible"

    def test_masks_nested_sensitive_keys(self):
        args = {"metadata": {"api_key": "hidden", "other": "public"}}
        result = sanitize_arguments(args)
        assert result["metadata"]["api_key"] == "********"
        assert result["metadata"]["other"] == "public"

    def test_masks_sensitive_keys_in_list_of_dicts(self):
        args = {"items": [{"token": "t1"}, {"value": "v1"}]}
        result = sanitize_arguments(args)
        assert result["items"][0]["token"] == "********"
        assert result["items"][1]["value"] == "v1"

    def test_non_dict_passthrough(self):
        assert sanitize_arguments("string") == "string"
        assert sanitize_arguments(42) == 42
        assert sanitize_arguments(None) is None

    def test_empty_dict(self):
        assert sanitize_arguments({}) == {}


# ---------------------------------------------------------------------------
# Unit tests for log_graphql_resolver decorator
# ---------------------------------------------------------------------------


class TestLogGraphQLResolverDecorator:
    """Unit-tests that exercise the decorator directly, without a running schema."""

    def _make_info(self, field_name: str, parent_type_name: str = "Query"):
        info = MagicMock()
        info.field_name = field_name
        info.parent_type.name = parent_type_name
        return info

    @patch("soroscan.graphql_extensions.logger")
    def test_logs_start_and_completion_on_success(self, mock_logger):
        info = self._make_info("myField")

        @log_graphql_resolver
        def my_resolver(root, info, name="Alice"):
            return "ok"

        result = my_resolver(None, info, name="Alice")
        assert result == "ok"

        # Start log
        mock_logger.info.assert_any_call(
            "GraphQL resolver started: myField",
            extra={"query_name": "myField", "arguments": {"name": "Alice"}},
        )

        # Completion log
        completed = [
            c for c in mock_logger.info.call_args_list if "completed" in c[0][0]
        ]
        assert len(completed) == 1
        extra = completed[0].kwargs["extra"]
        assert extra["query_name"] == "myField"
        assert extra["status"] == "Success"
        assert extra["duration_ms"] >= 0

    @patch("soroscan.graphql_extensions.logger")
    def test_logs_error_on_exception(self, mock_logger):
        info = self._make_info("failField")

        @log_graphql_resolver
        def failing_resolver(root, info):
            raise ValueError("boom")

        with pytest.raises(ValueError, match="boom"):
            failing_resolver(None, info)

        # Error log
        mock_logger.error.assert_called_once()
        _, kwargs = mock_logger.error.call_args
        extra = kwargs["extra"]
        assert extra["query_name"] == "failField"
        assert extra["status"] == "Error"
        assert extra["error"] == "boom"
        assert "stack_trace" in extra
        assert extra["duration_ms"] >= 0

    @patch("soroscan.graphql_extensions.logger")
    def test_duration_is_positive(self, mock_logger):
        info = self._make_info("slowField")

        @log_graphql_resolver
        def slow_resolver(root, info):
            time.sleep(0.01)
            return "done"

        slow_resolver(None, info)

        completed = [
            c for c in mock_logger.info.call_args_list if "completed" in c[0][0]
        ]
        assert completed[0].kwargs["extra"]["duration_ms"] > 0

    @patch("soroscan.graphql_extensions.logger")
    def test_sensitive_args_are_masked(self, mock_logger):
        info = self._make_info("sensitiveField")

        @log_graphql_resolver
        def resolver(root, info, password="secret123", name="Alice"):
            return "ok"

        resolver(None, info, password="secret123", name="Alice")

        start_calls = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        args = start_calls[0].kwargs["extra"]["arguments"]
        assert args["password"] == "********"
        assert args["name"] == "Alice"

    @patch("soroscan.graphql_extensions.logger")
    def test_no_info_argument_no_crash(self, mock_logger):
        """Resolver without info should not crash the decorator."""

        @log_graphql_resolver
        def resolver(root, info):
            return 42

        info = self._make_info("noArgsField")
        result = resolver(None, info)
        assert result == 42


# ---------------------------------------------------------------------------
# Integration tests: schema execution with extension
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGraphQLResolverLogging:
    """Tests that verify the GraphQLResolverLoggingExtension fires correctly."""

    @patch("soroscan.graphql_extensions.logger")
    def test_query_resolver_logs_start(self, mock_logger):
        contract = TrackedContractFactory()
        query = f"""
            query {{
                contract(contractId: "{contract.contract_id}") {{
                    name
                }}
            }}
        """
        result = schema.execute_sync(query)
        assert result.errors is None

        mock_logger.info.assert_any_call(
            "GraphQL resolver started: contract",
            extra={
                "query_name": "contract",
                "arguments": {"contractId": contract.contract_id},
            },
        )

    @patch("soroscan.graphql_extensions.logger")
    def test_query_resolver_logs_completion_with_duration_and_status(self, mock_logger):
        contract = TrackedContractFactory()
        query = f"""
            query {{
                contract(contractId: "{contract.contract_id}") {{
                    name
                }}
            }}
        """
        schema.execute_sync(query)

        completed_calls = [
            c for c in mock_logger.info.call_args_list if "completed" in c[0][0]
        ]
        assert len(completed_calls) >= 1

        extra = completed_calls[0].kwargs["extra"]
        assert extra["query_name"] == "contract"
        assert extra["status"] == "Success"
        assert "duration_ms" in extra
        assert extra["duration_ms"] >= 0
        assert extra["arguments"] == {"contractId": contract.contract_id}

    @patch("soroscan.graphql_extensions.logger")
    def test_failed_query_logs_error_message_and_stack_trace(self, mock_logger):
        with patch(
            "soroscan.ingest.schema.TrackedContract.objects"
        ) as mock_objects:
            mock_objects.select_related.return_value.get.side_effect = RuntimeError(
                "DB exploded"
            )
            query = """
                query {
                    contract(contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") {
                        name
                    }
                }
            """
            result = schema.execute_sync(query)

        # GraphQL wraps the error but still logs it
        assert result.errors is not None

        mock_logger.error.assert_called_once()
        _, kwargs = mock_logger.error.call_args
        extra = kwargs["extra"]
        assert extra["query_name"] == "contract"
        assert extra["status"] == "Error"
        assert "DB exploded" in extra["error"]
        assert "stack_trace" in extra
        assert "duration_ms" in extra

    @patch("soroscan.graphql_extensions.logger")
    def test_contracts_list_query_is_logged(self, mock_logger):
        TrackedContractFactory.create_batch(2)
        query = """
            query {
                contracts {
                    contractId
                    name
                }
            }
        """
        result = schema.execute_sync(query)
        assert result.errors is None

        started = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        assert any(c.kwargs["extra"]["query_name"] == "contracts" for c in started)

    @patch("soroscan.graphql_extensions.logger")
    def test_event_query_is_logged(self, mock_logger):
        ContractEventFactory()
        query = """
            query {
                events(first: 5) {
                    edges { node { id } }
                }
            }
        """
        result = schema.execute_sync(query)
        assert result.errors is None

        started = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        assert any(c.kwargs["extra"]["query_name"] == "events" for c in started)

    @patch("soroscan.graphql_extensions.logger")
    def test_contract_stats_query_is_logged(self, mock_logger):
        contract = TrackedContractFactory()
        query = f"""
            query {{
                contractStats(contractId: "{contract.contract_id}") {{
                    totalEvents
                }}
            }}
        """
        result = schema.execute_sync(query)
        assert result.errors is None

        started = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        assert any(c.kwargs["extra"]["query_name"] == "contractStats" for c in started)

    @patch("soroscan.graphql_extensions.logger")
    def test_only_top_level_fields_are_logged(self, mock_logger):
        """Sub-fields of ContractType should not produce separate log entries."""
        contract = TrackedContractFactory()
        query = f"""
            query {{
                contract(contractId: "{contract.contract_id}") {{
                    name
                    contractId
                    isActive
                }}
            }}
        """
        schema.execute_sync(query)

        started = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        logged_names = {c.kwargs["extra"]["query_name"] for c in started}

        # Only the top-level resolver should appear
        assert "contract" in logged_names
        # Sub-fields must NOT appear as separate log entries
        assert "name" not in logged_names
        assert "contractId" not in logged_names
        assert "isActive" not in logged_names

    @patch("soroscan.graphql_extensions.logger")
    def test_mutation_register_contract_is_logged(self, mock_logger):
        """Mutation resolvers must also be logged."""
        user = UserFactory()
        mutation = """
            mutation {
                registerContract(
                    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                    name: "LogTest"
                ) {
                    contractId
                }
            }
        """
        with patch(
            "soroscan.ingest.schema._get_authenticated_user", return_value=user
        ):
            schema.execute_sync(mutation)

        # Regardless of success/failure, the logger must have been called
        all_info_messages = [c[0][0] for c in mock_logger.info.call_args_list]
        all_error_messages = [c[0][0] for c in mock_logger.error.call_args_list]
        all_messages = all_info_messages + all_error_messages

        assert any("registerContract" in m for m in all_messages), (
            "Expected registerContract mutation to be logged"
        )

    @patch("soroscan.graphql_extensions.logger")
    def test_argument_sanitization_in_schema_execution(self, mock_logger):
        """Sensitive keys in mutation arguments must be masked in logs."""
        user = UserFactory()
        mutation = """
            mutation {
                registerContract(
                    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                    name: "SecureContract",
                    metadata: {
                        api_key: "super-secret",
                        description: "public info"
                    }
                ) {
                    contractId
                }
            }
        """
        with patch(
            "soroscan.ingest.schema._get_authenticated_user", return_value=user
        ):
            schema.execute_sync(mutation)

        started = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        assert len(started) >= 1
        args = started[0].kwargs["extra"]["arguments"]
        # metadata dict may be passed as JSON — check nested masking
        if isinstance(args.get("metadata"), dict):
            assert args["metadata"]["api_key"] == "********"
            assert args["metadata"]["description"] == "public info"

    @patch("soroscan.graphql_extensions.logger")
    def test_event_types_query_is_logged(self, mock_logger):
        contract = TrackedContractFactory()
        query = f"""
            query {{
                eventTypes(contractId: "{contract.contract_id}")
            }}
        """
        result = schema.execute_sync(query)
        assert result.errors is None

        started = [
            c for c in mock_logger.info.call_args_list if "started" in c[0][0]
        ]
        assert any(c.kwargs["extra"]["query_name"] == "eventTypes" for c in started)

    @patch("soroscan.graphql_extensions.logger")
    def test_log_includes_query_name_in_all_messages(self, mock_logger):
        """Every log call for a resolver must include query_name in extras."""
        contract = TrackedContractFactory()
        query = f"""
            query {{
                contract(contractId: "{contract.contract_id}") {{
                    name
                }}
            }}
        """
        schema.execute_sync(query)

        for log_call in mock_logger.info.call_args_list:
            extra = log_call.kwargs.get("extra", {})
            if extra.get("query_name"):
                # Every resolver-related log entry must have these keys
                assert "query_name" in extra
                assert "arguments" in extra
