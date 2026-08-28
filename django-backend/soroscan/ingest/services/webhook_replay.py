"""
Webhook event replay service with filtering, rate limiting, and status tracking.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Any

from django.db.models import QuerySet
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from soroscan.ingest.models import (
    ContractEvent,
    TrackedContract,
    WebhookReplayJob,
    WebhookSubscription,
)

logger = logging.getLogger(__name__)


def parse_optional_datetime(value: str | datetime | None) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        dt = parse_datetime(str(value))
        if dt is None:
            try:
                dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError(f"Invalid datetime: {value}") from exc
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


def build_event_queryset(
    *,
    contract_id: str | None = None,
    event_type: str | None = None,
    from_date: str | datetime | None = None,
    to_date: str | datetime | None = None,
    from_ledger: int | None = None,
    to_ledger: int | None = None,
    limit: int | None = None,
) -> QuerySet:
    qs = ContractEvent.objects.select_related("contract").order_by(
        "ledger", "event_index", "timestamp"
    )
    if contract_id:
        qs = qs.filter(contract__contract_id=contract_id)
    if event_type:
        qs = qs.filter(event_type=event_type)
    if from_ledger is not None:
        qs = qs.filter(ledger__gte=from_ledger)
    if to_ledger is not None:
        qs = qs.filter(ledger__lte=to_ledger)
    from_dt = parse_optional_datetime(from_date)
    to_dt = parse_optional_datetime(to_date)
    if from_dt:
        qs = qs.filter(timestamp__gte=from_dt)
    if to_dt:
        qs = qs.filter(timestamp__lte=to_dt)
    if limit and limit > 0:
        qs = qs[:limit]
    return qs


def create_replay_job(
    *,
    subscription: WebhookSubscription | None = None,
    requested_by=None,
    contract_id: str | None = None,
    event_type: str | None = None,
    from_date=None,
    to_date=None,
    from_ledger: int | None = None,
    to_ledger: int | None = None,
    limit: int = 100,
    rate_limit_per_second: float = 5.0,
    dry_run: bool = False,
) -> WebhookReplayJob:
    resolved_contract_id = contract_id
    if subscription is not None and not resolved_contract_id:
        resolved_contract_id = subscription.contract.contract_id

    if not resolved_contract_id:
        raise ValueError("contract_id is required when subscription is not provided")

    if not TrackedContract.objects.filter(contract_id=resolved_contract_id).exists():
        raise ValueError(f"No TrackedContract found with contract_id={resolved_contract_id!r}")

    if subscription is not None and subscription.contract.contract_id != resolved_contract_id:
        raise ValueError("subscription does not belong to the specified contract")

    filters = {
        "contract_id": resolved_contract_id,
        "event_type": event_type,
        "from_date": str(from_date) if from_date else None,
        "to_date": str(to_date) if to_date else None,
        "from_ledger": from_ledger,
        "to_ledger": to_ledger,
        "limit": limit,
        "dry_run": dry_run,
    }

    matching = build_event_queryset(
        contract_id=resolved_contract_id,
        event_type=event_type,
        from_date=from_date,
        to_date=to_date,
        from_ledger=from_ledger,
        to_ledger=to_ledger,
        limit=None,
    )
    total = matching.count()
    planned = min(total, limit) if limit and limit > 0 else total

    return WebhookReplayJob.objects.create(
        subscription=subscription,
        requested_by=requested_by,
        contract_id=resolved_contract_id,
        filters=filters,
        rate_limit_per_second=rate_limit_per_second,
        dry_run=dry_run,
        status=WebhookReplayJob.STATUS_PENDING,
        total_events=planned,
    )


def _resolve_webhooks(
    job: WebhookReplayJob,
) -> list[WebhookSubscription]:
    if job.subscription_id:
        return [job.subscription]
    return list(
        WebhookSubscription.objects.filter(
            contract__contract_id=job.contract_id,
            is_active=True,
        )
    )


def _dispatch_one(
    webhook: WebhookSubscription,
    event: ContractEvent,
    *,
    dry_run: bool,
) -> dict[str, Any]:
    if dry_run:
        return {
            "event_id": event.id,
            "webhook_id": webhook.id,
            "status": "dry-run",
            "success": True,
        }

    from soroscan.ingest.tasks import dispatch_webhook

    try:
        result = dispatch_webhook.apply(args=[webhook.id, event.id])
        if result.successful():
            return {
                "event_id": event.id,
                "webhook_id": webhook.id,
                "status": "success",
                "success": True,
            }
        return {
            "event_id": event.id,
            "webhook_id": webhook.id,
            "status": "failed",
            "success": False,
            "error": str(result.result) if result.result else "Task failed",
        }
    except Exception as exc:
        return {
            "event_id": event.id,
            "webhook_id": webhook.id,
            "status": "error",
            "success": False,
            "error": str(exc),
        }


def run_replay_job(job_id: int) -> dict[str, Any]:
    """
    Execute a WebhookReplayJob with pacing based on rate_limit_per_second.
    """
    job = WebhookReplayJob.objects.select_related("subscription").get(pk=job_id)
    if job.status in (
        WebhookReplayJob.STATUS_COMPLETED,
        WebhookReplayJob.STATUS_CANCELLED,
    ):
        return job.to_status_dict()

    job.status = WebhookReplayJob.STATUS_RUNNING
    job.started_at = timezone.now()
    job.error_message = ""
    job.save(update_fields=["status", "started_at", "error_message", "updated_at"])

    filters = job.filters or {}
    try:
        events = list(
            build_event_queryset(
                contract_id=job.contract_id,
                event_type=filters.get("event_type"),
                from_date=filters.get("from_date"),
                to_date=filters.get("to_date"),
                from_ledger=filters.get("from_ledger"),
                to_ledger=filters.get("to_ledger"),
                limit=filters.get("limit") or 0,
            )
        )
        webhooks = _resolve_webhooks(job)
        if not webhooks:
            job.status = WebhookReplayJob.STATUS_FAILED
            job.error_message = "No webhooks available for replay"
            job.finished_at = timezone.now()
            job.save(
                update_fields=["status", "error_message", "finished_at", "updated_at"]
            )
            return job.to_status_dict()

        job.total_events = len(events)
        job.save(update_fields=["total_events", "updated_at"])

        interval = 0.0
        if job.rate_limit_per_second and job.rate_limit_per_second > 0:
            interval = 1.0 / float(job.rate_limit_per_second)

        deliveries: list[dict[str, Any]] = []
        processed = 0
        succeeded = 0
        failed = 0
        skipped = 0

        for event in events:
            job.refresh_from_db(fields=["status"])
            if job.status == WebhookReplayJob.STATUS_CANCELLED:
                break

            for webhook in webhooks:
                event_type_filter = filters.get("event_type")
                if event_type_filter and webhook.event_type and webhook.event_type != event_type_filter:
                    skipped += 1
                    continue
                if webhook.event_type and webhook.event_type != event.event_type:
                    skipped += 1
                    continue
                if hasattr(webhook, "should_ingest_event") and not webhook.should_ingest_event(
                    event.event_type
                ):
                    skipped += 1
                    continue
                # Also honor contract-level event filters when present.
                if hasattr(event.contract, "should_ingest_event") and not event.contract.should_ingest_event(
                    event.event_type
                ):
                    skipped += 1
                    continue

                result = _dispatch_one(webhook, event, dry_run=job.dry_run)
                deliveries.append(result)
                if result.get("success"):
                    succeeded += 1
                else:
                    failed += 1

                if interval > 0 and not job.dry_run:
                    time.sleep(interval)

            processed += 1
            if processed % 10 == 0 or processed == len(events):
                job.processed_events = processed
                job.succeeded = succeeded
                job.failed = failed
                job.skipped = skipped
                job.result = {"deliveries": deliveries[-50:]}
                job.save(
                    update_fields=[
                        "processed_events",
                        "succeeded",
                        "failed",
                        "skipped",
                        "result",
                        "updated_at",
                    ]
                )

        job.refresh_from_db(fields=["status"])
        if job.status != WebhookReplayJob.STATUS_CANCELLED:
            job.status = WebhookReplayJob.STATUS_COMPLETED
        job.processed_events = processed
        job.succeeded = succeeded
        job.failed = failed
        job.skipped = skipped
        job.result = {
            "deliveries": deliveries[-200:],
            "summary": {
                "events_processed": processed,
                "successes": succeeded,
                "failures": failed,
                "skipped": skipped,
            },
        }
        job.finished_at = timezone.now()
        job.save(
            update_fields=[
                "status",
                "processed_events",
                "succeeded",
                "failed",
                "skipped",
                "result",
                "finished_at",
                "updated_at",
            ]
        )
    except Exception as exc:
        logger.exception("Webhook replay job %s failed", job_id)
        job.status = WebhookReplayJob.STATUS_FAILED
        job.error_message = str(exc)
        job.finished_at = timezone.now()
        job.save(
            update_fields=["status", "error_message", "finished_at", "updated_at"]
        )

    return job.to_status_dict()
