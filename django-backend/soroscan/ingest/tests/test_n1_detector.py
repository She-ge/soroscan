"""Tests for N+1 query detection middleware (issue #490)."""

from django.test import TestCase, override_settings

from soroscan.graphql_n1_detector import N1QueryDetectorExtension


class N1QueryDetectorTest(TestCase):
    """Verify the N+1 query detector extension."""

    def test_extension_is_a_strawberry_extension(self):
        from strawberry.extensions import SchemaExtension

        self.assertTrue(issubclass(N1QueryDetectorExtension, SchemaExtension))

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=True, DEBUG=True)
    def test_enabled_in_debug_mode(self):
        ext = N1QueryDetectorExtension()
        self.assertTrue(ext._is_enabled())

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=False)
    def test_disabled_when_not_enabled(self):
        ext = N1QueryDetectorExtension()
        self.assertFalse(ext._is_enabled())

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=True, DEBUG=False)
    def test_enabled_can_be_forced_in_production(self):
        ext = N1QueryDetectorExtension()
        self.assertTrue(ext._is_enabled())

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=False, DEBUG=False)
    def test_disabled_by_default_in_production(self):
        ext = N1QueryDetectorExtension()
        self.assertFalse(ext._is_enabled())

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=False)
    def test_bypasses_when_disabled(self):
        from unittest.mock import MagicMock

        ext = N1QueryDetectorExtension()
        info = MagicMock()
        info.parent_type.name = "Query"
        info.field_name = "contracts"

        def mock_next(root, info, *args, **kwargs):
            return []

        result = ext.resolve(mock_next, None, info)
        self.assertEqual(result, [])

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=True)
    def test_resolves_and_returns_result(self):
        from unittest.mock import MagicMock

        ext = N1QueryDetectorExtension()
        info = MagicMock()
        info.parent_type.name = "Query"
        info.field_name = "contract"

        def mock_next(root, info, *args, **kwargs):
            return None

        result = ext.resolve(mock_next, None, info)
        self.assertIsNone(result)

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=True)
    def test_skips_non_query_mutation_resolvers(self):
        from unittest.mock import MagicMock

        ext = N1QueryDetectorExtension()
        info = MagicMock()
        info.parent_type.name = "Subscription"
        info.field_name = "events"

        def mock_next(root, info, *args, **kwargs):
            return "sub_result"

        result = ext.resolve(mock_next, None, info)
        self.assertEqual(result, "sub_result")

    @override_settings(GRAPHQL_N1_DETECTION_ENABLED=True)
    def test_logs_warning_for_many_queries(self):
        from unittest.mock import MagicMock, patch

        ext = N1QueryDetectorExtension()
        info = MagicMock()
        info.parent_type.name = "Query"
        info.field_name = "contracts"

        def mock_next(root, info, *args, **kwargs):
            return []

        # Simulate queries growing from 0 to 10 during resolver execution
        call_count = [0]

        class GrowingQueryList:
            def __len__(self):
                call_count[0] += 1
                return 10 if call_count[0] > 1 else 0

        with patch("soroscan.graphql_n1_detector.connection") as mock_conn:
            mock_conn.queries = GrowingQueryList()
            with patch("soroscan.graphql_n1_detector.logger") as mock_logger:
                result = ext.resolve(mock_next, None, info)
                self.assertEqual(result, [])
                mock_logger.warning.assert_called_once()
                call_args = mock_logger.warning.call_args
                self.assertIn("N+1", call_args[0][0])
                # The field name is passed as the first format arg
                self.assertEqual(call_args[0][1], "contracts")
