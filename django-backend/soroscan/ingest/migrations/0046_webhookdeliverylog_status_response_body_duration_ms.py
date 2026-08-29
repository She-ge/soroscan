"""
Migration: Add status, response_body, and duration_ms to WebhookDeliveryLog.

Issue #765 - Webhook Dead-Letter Queue and Retry Policy.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ingest", "0045_organization_cors_origins"),
    ]

    operations = [
        migrations.AddField(
            model_name="webhookdeliverylog",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("success", "Success"),
                    ("failed", "Failed"),
                    ("dead_letter", "Dead Letter"),
                ],
                db_index=True,
                default="pending",
                help_text="Delivery status: pending to success or failed to dead_letter",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="webhookdeliverylog",
            name="response_body",
            field=models.TextField(
                blank=True,
                default="",
                help_text="First 4 KB of the subscriber response body",
            ),
        ),
        migrations.AddField(
            model_name="webhookdeliverylog",
            name="duration_ms",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                help_text="Total round-trip duration in milliseconds",
            ),
        ),
        migrations.AddIndex(
            model_name="webhookdeliverylog",
            index=models.Index(
                fields=["subscription", "status"],
                name="ingest_whde_sub_status_idx",
            ),
        ),
    ]
