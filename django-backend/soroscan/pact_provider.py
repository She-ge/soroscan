"""
Pact provider-state endpoint for contract verification.

Only active when PACT_PROVIDER_STATES_ENABLED is set (test / CI environments).
"""
from __future__ import annotations

import json

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import HttpResponseForbidden, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from soroscan.ingest.models import APIKey, ContractEvent, TrackedContract

User = get_user_model()

PACT_API_KEY = "pact-test-key-32chars-minimum-length-here12"
PACT_CONTRACT_ID = "C" + "A" * 55


def _pact_user():
    user, _ = User.objects.get_or_create(
        username="pact-test-user",
        defaults={"email": "pact-test@soroscan.test"},
    )
    return user


def _reset_pact_data() -> None:
    ContractEvent.objects.filter(contract__contract_id=PACT_CONTRACT_ID).delete()
    TrackedContract.objects.filter(contract_id=PACT_CONTRACT_ID).delete()
    APIKey.objects.filter(key=PACT_API_KEY).delete()


def _ensure_contract_events() -> TrackedContract:
    user = _pact_user()
    contract, _ = TrackedContract.objects.get_or_create(
        contract_id=PACT_CONTRACT_ID,
        defaults={
            "name": "Pact Test Contract",
            "owner": user,
            "is_active": True,
            "network": TrackedContract.Network.MAINNET,
        },
    )
    if not contract.events.exists():
        ContractEvent.objects.create(
            contract=contract,
            event_type="transfer",
            payload={"amount": "100"},
            payload_hash="a" * 64,
            ledger=123456,
            event_index=1,
            tx_hash="b" * 64,
            timestamp=timezone.now(),
        )
    return contract


def _ensure_api_access() -> None:
    user = _pact_user()
    APIKey.objects.get_or_create(
        key=PACT_API_KEY,
        defaults={
            "user": user,
            "name": "pact-test",
            "tier": APIKey.Tier.FREE,
            "quota_per_hour": 10_000,
            "is_active": True,
        },
    )
    TrackedContract.objects.get_or_create(
        contract_id=PACT_CONTRACT_ID,
        defaults={
            "name": "Pact API Contract",
            "owner": user,
            "is_active": True,
            "network": TrackedContract.Network.MAINNET,
        },
    )


def apply_provider_state(state: str) -> None:
    _reset_pact_data()

    if state == "the API is healthy":
        return

    if state == "contract events exist":
        _ensure_contract_events()
        return

    if state == "a tracked contract exists":
        _ensure_contract_events()
        return

    if state == "user has API access with contracts":
        _ensure_api_access()
        return

    raise ValueError(f"Unknown pact provider state: {state}")


@csrf_exempt
@require_POST
def provider_states(request):
    if not getattr(settings, "PACT_PROVIDER_STATES_ENABLED", False):
        return HttpResponseForbidden("Pact provider states are disabled")

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid JSON"}, status=400)

    state = payload.get("state")
    if not state:
        return JsonResponse({"error": "state is required"}, status=400)

    try:
        apply_provider_state(state)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    return JsonResponse({"result": "success"})
