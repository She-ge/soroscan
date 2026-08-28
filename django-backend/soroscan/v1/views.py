"""
Public v1 API views consumed by the TypeScript SDK.

These endpoints return the cursor-based pagination shape expected by
@soroscan/sdk while sourcing data from the ingest models.
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from soroscan.ingest.models import ContractEvent, TrackedContract


def _isoformat(value) -> str | None:
    if value is None:
        return None
    text = value.isoformat()
    if text.endswith("+00:00"):
        return text.replace("+00:00", "Z")
    return text


def _event_to_sdk(event: ContractEvent) -> dict:
    return {
        "id": str(event.id),
        "ledger": event.ledger,
        "ledgerClosedAt": _isoformat(event.timestamp),
        "txHash": event.tx_hash,
        "contractId": event.contract.contract_id,
        "type": event.event_type,
        "topics": [{"type": "symbol", "value": event.event_type}],
        "value": event.payload,
        "inSuccessfulContractCall": True,
        "pagingToken": f"{event.ledger}-{event.event_index}",
    }


def _contract_to_sdk(contract: TrackedContract) -> dict:
    return {
        "id": contract.contract_id,
        "network": contract.network,
        "type": "custom",
        "wasmHash": "",
        "creator": "",
        "createdAt": _isoformat(contract.created_at),
        "createdLedger": contract.last_indexed_ledger or 0,
        "lastActivityAt": _isoformat(contract.last_event_at),
        "totalEvents": contract.events.count(),
        "spec": None,
        "verified": False,
        "verifiedAt": None,
        "sourceCode": None,
        "label": contract.name,
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def list_events(request):
    """
    List contract events in the cursor-based shape expected by the TypeScript SDK.

    Query params:
    - first (int) - Maximum items to return, capped at 200 (default 20)
    - contractId (string) - Filter by Soroban contract ID
    - eventType (string) - Filter by event type label

    - 200: Paginated event list with pageInfo cursors
    """
    try:
        first = min(int(request.query_params.get("first", 20)), 200)
    except (TypeError, ValueError):
        first = 20

    queryset = ContractEvent.objects.select_related("contract").order_by("-timestamp")

    contract_id = request.query_params.get("contractId")
    if contract_id:
        queryset = queryset.filter(contract__contract_id=contract_id)

    event_type = request.query_params.get("eventType")
    if event_type:
        queryset = queryset.filter(event_type=event_type)

    total = queryset.count()
    events = list(queryset[:first])
    items = [_event_to_sdk(event) for event in events]

    return Response(
        {
            "items": items,
            "pageInfo": {
                "hasNextPage": total > first,
                "hasPreviousPage": False,
                "startCursor": items[0]["pagingToken"] if items else None,
                "endCursor": items[-1]["pagingToken"] if items else None,
            },
            "totalCount": total,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_contract(request, contract_id: str):
    """
    Retrieve a single tracked contract for the TypeScript SDK.

    - 200: Contract metadata and activity summary
    - 404: Contract not found
    """
    try:
        contract = TrackedContract.objects.get(contract_id=contract_id)
    except TrackedContract.DoesNotExist:
        return Response(
            {"code": "NOT_FOUND", "message": "Contract not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(_contract_to_sdk(contract))
