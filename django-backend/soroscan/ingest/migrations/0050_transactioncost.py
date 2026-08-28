# Generated migration for TransactionCost and TransactionCostAggregation models

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ingest", "0049_eventaggregation"),
    ]

    operations = [
        migrations.CreateModel(
            name="TransactionCost",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("tx_hash", models.CharField(db_index=True, max_length=64, unique=True)),
                ("function_name", models.CharField(blank=True, db_index=True, max_length=128)),
                ("ledger_sequence", models.PositiveBigIntegerField(db_index=True)),
                ("total_fee_stroops", models.BigIntegerField(default=0)),
                ("inclusion_fee_stroops", models.BigIntegerField(default=0)),
                ("resource_fee_stroops", models.BigIntegerField(default=0)),
                ("cpu_instructions_used", models.BigIntegerField(default=0)),
                ("memory_bytes_used", models.BigIntegerField(default=0)),
                ("read_bytes_used", models.BigIntegerField(default=0)),
                ("write_bytes_used", models.BigIntegerField(default=0)),
                ("is_outlier", models.BooleanField(default=False, db_index=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "contract",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transaction_costs",
                        to="ingest.trackedcontract",
                    ),
                ),
                (
                    "invocation",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="cost",
                        to="ingest.contractinvocation",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="transactioncost",
            index=models.Index(
                fields=["contract", "created_at"],
                name="ingest_tc_ctr_cat_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transactioncost",
            index=models.Index(
                fields=["contract", "function_name", "created_at"],
                name="ingest_tc_ctr_fn_cat_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transactioncost",
            index=models.Index(
                fields=["function_name"],
                name="ingest_tc_fn_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transactioncost",
            index=models.Index(
                fields=["is_outlier", "created_at"],
                name="ingest_tc_outlier_idx",
            ),
        ),
        migrations.CreateModel(
            name="TransactionCostAggregation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("function_name", models.CharField(db_index=True, max_length=128)),
                ("timestamp", models.DateTimeField(db_index=True)),
                ("call_count", models.IntegerField(default=0)),
                ("avg_fee_stroops", models.BigIntegerField(default=0)),
                ("min_fee_stroops", models.BigIntegerField(default=0)),
                ("max_fee_stroops", models.BigIntegerField(default=0)),
                ("total_fee_stroops", models.BigIntegerField(default=0)),
                ("avg_cpu_instructions", models.BigIntegerField(default=0)),
                ("avg_memory_bytes", models.BigIntegerField(default=0)),
                ("outlier_count", models.IntegerField(default=0)),
                (
                    "contract",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cost_aggregations",
                        to="ingest.trackedcontract",
                    ),
                ),
            ],
            options={"ordering": ["-timestamp"]},
        ),
        migrations.AddConstraint(
            model_name="transactioncostaggregation",
            constraint=models.UniqueConstraint(
                fields=("contract", "function_name", "timestamp"),
                name="unique_cost_agg_contract_fn_ts",
            ),
        ),
        migrations.AddIndex(
            model_name="transactioncostaggregation",
            index=models.Index(
                fields=["contract", "timestamp"],
                name="ingest_tca_contract_ts_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transactioncostaggregation",
            index=models.Index(
                fields=["timestamp"],
                name="ingest_tca_timestamp_idx",
            ),
        ),
    ]
