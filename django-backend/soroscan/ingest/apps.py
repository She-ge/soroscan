from django.apps import AppConfig


class IngestConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "soroscan.ingest"
    verbose_name = "SoroScan Ingest"

    def ready(self):
        import soroscan.ingest.signals  # noqa: F401 — registers signal handlers
        from soroscan.operational_metrics import register_operational_collector
        from soroscan.shutdown import register_shutdown_handlers

        register_operational_collector()
        register_shutdown_handlers()
