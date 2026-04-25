import pytest
from unittest.mock import patch
from soroscan.ingest.schema import schema
from .factories import TrackedContractFactory

@pytest.mark.django_db
class TestGraphQLLogging:
    @patch("soroscan.graphql_extensions.logger")
    def test_resolver_logging_success(self, mock_logger):
        # Create a contract to query
        contract = TrackedContractFactory(name="Test Contract")
        
        query = f"""
            query {{
                contract(contractId: "{contract.contract_id}") {{
                    name
                }}
            }}
        """
        
        # Execute query
        result = schema.execute_sync(query)
        assert result.errors is None
        
        # Verify "started" log
        # GraphQL arguments are passed to extensions as they appear in the query (un-snake-cased)
        mock_logger.info.assert_any_call(
            "GraphQL resolver started: contract",
            extra={
                "query_name": "contract",
                "arguments": {"contractId": contract.contract_id}
            }
        )
        
        # Verify "completed" log
        completed_calls = [
            c for c in mock_logger.info.call_args_list 
            if "GraphQL resolver completed" in c[0][0]
        ]
        assert len(completed_calls) == 1
        
        extra = completed_calls[0].kwargs["extra"]
        assert extra["query_name"] == "contract"
        assert extra["status"] == "Success"
        assert "duration_ms" in extra
        assert extra["arguments"] == {"contractId": contract.contract_id}

    @patch("soroscan.graphql_extensions.logger")
    @patch("soroscan.ingest.schema.TrackedContract.objects")
    def test_resolver_logging_error(self, mock_objects, mock_logger):
        # Mock an error in the resolver (top-level query)
        mock_objects.select_related.return_value.get.side_effect = Exception("Test Database Error")
        
        query = """
            query {
                contract(contractId: "any-id") {
                    name
                }
            }
        """
        
        # Execute query
        result = schema.execute_sync(query)
        assert result.errors is not None
        
        # Verify "started" log
        mock_logger.info.assert_any_call(
            "GraphQL resolver started: contract",
            extra={
                "query_name": "contract",
                "arguments": {"contractId": "any-id"}
            }
        )
        
        # Verify "failed" log
        mock_logger.error.assert_called_once()
        log_args, log_kwargs = mock_logger.error.call_args
        assert "GraphQL resolver failed: contract" in log_args[0]
        
        extra = log_kwargs["extra"]
        assert extra["query_name"] == "contract"
        assert extra["status"] == "Error"
        assert extra["error"] == "Test Database Error"
        assert "stack_trace" in extra
        assert "duration_ms" in extra

    @patch("soroscan.graphql_extensions.logger")
    def test_no_logging_for_non_top_level_fields(self, mock_logger):
        # Create a contract with metadata
        contract = TrackedContractFactory(name="Test Contract")
        
        query = f"""
            query {{
                contract(contractId: "{contract.contract_id}") {{
                    name
                    verificationStatus
                }}
            }}
        """
        
        # Execute query
        schema.execute_sync(query)
        
        # Verify only the top-level 'contract' resolver was logged
        # started and completed logs for 'contract'
        started_calls = [c for c in mock_logger.info.call_args_list if "started" in c[0][0]]
        completed_calls = [c for c in mock_logger.info.call_args_list if "completed" in c[0][0]]
        
        assert len(started_calls) == 1
        assert started_calls[0].kwargs["extra"]["query_name"] == "contract"
        
        assert len(completed_calls) == 1
        assert completed_calls[0].kwargs["extra"]["query_name"] == "contract"
        
        # 'name' and 'verificationStatus' should NOT be logged as they are fields of ContractType, not top-level Query
        query_names = [c.kwargs["extra"].get("query_name") for c in mock_logger.info.call_args_list]
        assert "name" not in query_names
        assert "verificationStatus" not in query_names
