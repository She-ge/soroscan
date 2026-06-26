"""Add cors_origins field to Organization for per-org CORS configuration."""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ingest", "0044_contractevent_payload_compression"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="cors_origins",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text=(
                    "List of allowed CORS origins for this organization, e.g. "
                    '["https://app.example.com", "https://staging.example.com"]. '
                    "Each entry must start with http:// or https://. "
                    "These are merged with the global CORS_ALLOWED_ORIGINS setting."
                ),
            ),
        ),
    ]
