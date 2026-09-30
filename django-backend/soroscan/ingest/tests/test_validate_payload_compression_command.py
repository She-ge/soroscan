from io import StringIO

import pytest
from django.core.management import call_command
from django.db import connection

from soroscan.ingest.models import ContractEvent
from .factories import ContractEventFactory


@pytest.mark.django_db
def test_reports_valid_and_corrupt_payloads():
    valid_event = ContractEventFactory()
    corrupt_event = ContractEventFactory()
    table_name = connection.ops.quote_name(ContractEvent._meta.db_table)
    with connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE {table_name} SET payload = %s WHERE id = %s",
            [b"not a compressed payload", corrupt_event.pk],
        )

    output = StringIO()
    call_command("validate_payload_compression", stdout=output)

    result = output.getvalue()
    assert "Valid payloads: 1" in result
    assert "Corrupt payloads: 1" in result
    assert f"ContractEvent id={corrupt_event.pk}" in result
    assert f"ContractEvent id={valid_event.pk}" not in result


@pytest.mark.django_db
def test_empty_table_reports_zero_counts():
    output = StringIO()

    call_command("validate_payload_compression", stdout=output)

    assert "Checked 0 recent event payload(s): 0 valid, 0 corrupt." in output.getvalue()