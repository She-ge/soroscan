# Generated migration for ContractHealthCheck model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ingest", "0047_trackedcontract_is_paused_and_more"),
        ("ingest", "0048_merge_0046_webhookdeliverylog_0047_trackedcontract_pause"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContractHealthCheck",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("healthy", "Healthy"),
                            ("degraded", "Degraded"),
                            ("failed", "Failed"),
                        ],
                        default="healthy",
                        db_index=True,
                        max_length=16,
                    ),
                ),
                (
                    "last_event_time",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        help_text="Timestamp of the most recently indexed event for this contract",
                    ),
                ),
                (
                    "minutes_since_last_event",
                    models.IntegerField(
                        default=0,
                        help_text="Minutes elapsed since the last indexed event",
                    ),
                ),
                (
                    "abi_decode_errors_1h",
                    models.IntegerField(
                        default=0,
                        help_text="Number of ABI decode failures in the last hour",
                    ),
                ),
                (
                    "consecutive_failures",
                    models.IntegerField(
                        default=0,
                        help_text="Number of consecutive health check runs that returned non-healthy",
                    ),
                ),
                (
                    "error_message",
                    models.TextField(
                        blank=True,
                        help_text="Human-readable description of the current health issue",
                    ),
                ),
                (
                    "checked_at",
                    models.DateTimeField(
                        auto_now=True,
                        db_index=True,
                        help_text="Timestamp of the last health check run",
                    ),
                ),
                (
                    "contract",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="health_check",
                        to="ingest.trackedcontract",
                    ),
                ),
            ],
            options={
                "verbose_name": "Contract Health Check",
                "verbose_name_plural": "Contract Health Checks",
                "ordering": ["-checked_at"],
                "indexes": [
                    models.Index(
                        fields=["status", "checked_at"],
                        name="ingest_cont_status_checked_idx",
                    ),
                ],
            },
        ),
    ]
