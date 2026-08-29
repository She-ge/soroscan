"""
Incident response playbooks: alert → action mappings and automation helpers.

Playbook documents live under ``docs/deployment/playbooks/``. This module
encodes the machine-readable alert→action map used by remediation rules and
ops automation.
"""

from __future__ import annotations

from typing import Any

# Canonical alert identifiers matching Prometheus rule names / remediation
# condition types.
ALERT_INGESTION_LAG = "event_ingestion_lag"
ALERT_WEBHOOK_FAILURE_BURST = "webhook_delivery_failure_burst"
ALERT_DB_POOL_EXHAUSTED = "database_connection_pool_exhausted"
ALERT_RPC_UNAVAILABLE = "rpc_endpoint_unavailable"

PLAYBOOK_PATHS = {
    ALERT_INGESTION_LAG: "docs/deployment/playbooks/event-ingestion-lag.md",
    ALERT_WEBHOOK_FAILURE_BURST: "docs/deployment/playbooks/webhook-delivery-failure-burst.md",
    ALERT_DB_POOL_EXHAUSTED: "docs/deployment/playbooks/database-connection-pool-exhausted.md",
    ALERT_RPC_UNAVAILABLE: "docs/deployment/playbooks/rpc-endpoint-unavailable.md",
}

# Alert → recommended automated actions (RemediationRule action types) and
# human runbook steps (referenced by docs).
ALERT_ACTION_MAP: dict[str, dict[str, Any]] = {
    ALERT_INGESTION_LAG: {
        "prometheus_alert": "SoroScanEventIngestionLag",
        "remediation_condition": "event_ingestion_lag",
        "severity": "critical",
        "automated_actions": [
            {"type": "send_alert"},
            {"type": "pause_contract"},
        ],
        "manual_actions": [
            "Check indexer cursor and Celery ingest workers",
            "Inspect Horizon/RPC lag and network partitions",
            "Re-run reconcile_event_completeness for affected contracts",
            "Resume contracts after catch-up",
        ],
        "playbook": PLAYBOOK_PATHS[ALERT_INGESTION_LAG],
        "default_condition": {
            "type": "event_ingestion_lag",
            "minutes": 15,
        },
    },
    ALERT_WEBHOOK_FAILURE_BURST: {
        "prometheus_alert": "SoroScanWebhookFailureBurst",
        "remediation_condition": "webhook_delivery_failure_burst",
        "severity": "critical",
        "automated_actions": [
            {"type": "send_alert"},
            {"type": "disable_webhooks"},
        ],
        "manual_actions": [
            "Inspect WebhookDeliveryLog failure rates by subscription",
            "Replay failed events after subscriber recovery",
            "Re-enable webhooks once target acknowledges",
        ],
        "playbook": PLAYBOOK_PATHS[ALERT_WEBHOOK_FAILURE_BURST],
        "default_condition": {
            "type": "webhook_delivery_failure_burst",
            "window_minutes": 10,
            "failure_threshold": 20,
            "failure_ratio_percent": 50,
        },
    },
    ALERT_DB_POOL_EXHAUSTED: {
        "prometheus_alert": "SoroScanDbPoolExhausted",
        "remediation_condition": "database_connection_pool_exhausted",
        "severity": "critical",
        "automated_actions": [
            {"type": "send_alert"},
        ],
        "manual_actions": [
            "Check GET /api/meta/db-pool/ for active vs max connections",
            "Scale down non-critical workers or raise pool hard limit carefully",
            "Kill idle sessions and investigate long-running queries",
        ],
        "playbook": PLAYBOOK_PATHS[ALERT_DB_POOL_EXHAUSTED],
        "default_condition": {
            "type": "database_connection_pool_exhausted",
            "utilization_percent": 90,
        },
    },
    ALERT_RPC_UNAVAILABLE: {
        "prometheus_alert": "SoroScanRpcEndpointUnavailable",
        "remediation_condition": "rpc_endpoint_unavailable",
        "severity": "critical",
        "automated_actions": [
            {"type": "send_alert"},
            {"type": "pause_contract"},
        ],
        "manual_actions": [
            "Verify SOROBAN_RPC_URL / Horizon health",
            "Failover to secondary RPC if configured",
            "Review IngestError rows with error_type=rpc_error",
            "Resume ingest after RPC recovers",
        ],
        "playbook": PLAYBOOK_PATHS[ALERT_RPC_UNAVAILABLE],
        "default_condition": {
            "type": "rpc_endpoint_unavailable",
            "window_minutes": 10,
            "min_errors": 5,
        },
    },
}


def get_alert_action_map() -> dict[str, dict[str, Any]]:
    return ALERT_ACTION_MAP


def default_remediation_rule_specs() -> list[dict[str, Any]]:
    """Return specs suitable for seeding RemediationRule rows."""
    specs = []
    for key, mapping in ALERT_ACTION_MAP.items():
        specs.append(
            {
                "name": f"playbook:{key}",
                "condition": mapping["default_condition"],
                "actions": mapping["automated_actions"],
                "enabled": True,
                "grace_period_minutes": 10,
                "alert_type": "slack",
                "dry_run": False,
                "playbook": mapping["playbook"],
                "prometheus_alert": mapping["prometheus_alert"],
            }
        )
    return specs
