from unittest.mock import patch, MagicMock

from soroscan.celery import record_celery_task_retry

class TestCeleryRetryLogging:
    @patch("soroscan.celery.logger")
    def test_record_celery_task_retry(self, mock_logger):
        mock_sender = MagicMock()
        mock_sender.name = "my_retry_task"
        mock_sender.max_retries = 5

        mock_request = MagicMock()
        mock_request.id = "task-id-123"
        mock_request.retries = 2
        mock_request.eta = "2026-06-30T00:00:00"

        mock_reason = ValueError("Something failed")
        mock_einfo = MagicMock()

        record_celery_task_retry(
            sender=mock_sender,
            request=mock_request,
            reason=mock_reason,
            einfo=mock_einfo,
        )

        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        assert args[0] == "Celery task retrying"
        assert kwargs["extra"]["task_name"] == "my_retry_task"
        assert kwargs["extra"]["task_id"] == "task-id-123"
        assert kwargs["extra"]["retry_attempt"] == 2
        assert kwargs["extra"]["max_retries"] == 5
        assert kwargs["extra"]["exception_type"] == "ValueError"
        assert kwargs["extra"]["exception_message"] == "Something failed"
        assert kwargs["extra"]["next_retry_timestamp"] == "2026-06-30T00:00:00"
