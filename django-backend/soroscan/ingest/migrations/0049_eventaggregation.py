# Generated migration for EventAggregation model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ingest", "0048_contracthealthcheck"),
    ]

    operations = [
        migrations.CreateModel(
            name="EventAggregation",
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
                    "event_type",
                    models.CharField(
                        db_index=True,
                        max_length=128,
                        help_text="Event type name, or '' for the per-contract total bucket.",
                    ),
                ),
                (
                    "timestamp",
                    models.DateTimeField(
                        db_index=True,
                        help_text="Start of the 1-hour bucket (UTC, minute=0).",
                    ),
                ),
                (
                    "event_count",
                    models.IntegerField(
                        default=0,
                        help_text="Number of events in this contract/event_type/hour bucket.",
                    ),
                ),
                (
                    "is_anomaly",
                    models.BooleanField(
                        default=False,
                        db_index=True,
                        help_text="True when this bucket triggered a volume-drop anomaly alert.",
                    ),
                ),
                (
                    "contract",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="aggregations",
                        to="ingest.trackedcontract",
                    ),
                ),
            ],
            options={
                "ordering": ["-timestamp"],
                "indexes": [
                    models.Index(
                        fields=["contract", "timestamp"],
                        name="ingest_evag_contract_ts_idx",
                    ),
                    models.Index(
                        fields=["timestamp"],
                        name="ingest_evag_timestamp_idx",
                    ),
                    models.Index(
                        fields=["contract", "event_type", "timestamp"],
                        name="ingest_evag_ctr_evtype_ts_idx",
                    ),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="eventaggregation",
            constraint=models.UniqueConstraint(
                fields=("contract", "event_type", "timestamp"),
                name="unique_contract_event_type_timestamp",
            ),
        ),
    ]
