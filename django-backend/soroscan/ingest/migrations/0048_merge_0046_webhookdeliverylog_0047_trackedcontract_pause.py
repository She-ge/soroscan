"""
Migration merge: resolves conflict between two leaf nodes both branching from 0045.

- 0046_webhookdeliverylog_status_response_body_duration_ms (Issue #765)
- 0047_trackedcontract_is_paused_and_more (Issue #833)
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("ingest", "0046_webhookdeliverylog_status_response_body_duration_ms"),
        ("ingest", "0047_trackedcontract_is_paused_and_more"),
    ]

    operations = []
