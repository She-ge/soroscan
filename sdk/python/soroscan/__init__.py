"""
SoroScan Python SDK

Official Python client for the SoroScan API - Stellar/Soroban event indexing.
"""

from soroscan.builder import (
    AsyncContractQueryBuilder,
    AsyncEventQueryBuilder,
    ContractQueryBuilder,
    EventQueryBuilder,
)
from soroscan.client import AsyncSoroScanClient, SoroScanClient
from soroscan.exceptions import (
    SoroScanAPIError,
    SoroScanAuthError,
    SoroScanError,
    SoroScanNotFoundError,
    SoroScanRateLimitError,
    SoroScanValidationError,
)
from soroscan.models import (
    ContractEvent,
    ContractHealth,
    ContractStats,
    ContractStatus,
    EventEntry,
    IndexerStats,
    PaginatedResponse,
    AddIndexerRequest,
    AddIndexerResponse,
    IsIndexerResponse,
    GetAdminResponse,
    RecordEventsBatchRequest,
    RecordEventsBatchResponse,
    TrackedContract,
    WebhookSubscription,
)
from soroscan.pagination import AsyncPaginator, Paginator
from soroscan.webhook_verification import verify_webhook_signature

__version__ = "0.2.0"
__all__ = [
    "SoroScanClient",
    "AsyncSoroScanClient",
    "EventQueryBuilder",
    "AsyncEventQueryBuilder",
    "ContractQueryBuilder",
    "AsyncContractQueryBuilder",
    "Paginator",
    "AsyncPaginator",
    "ContractEvent",
    "ContractHealth",
    "TrackedContract",
    "WebhookSubscription",
    "ContractStats",
    "ContractStatus",
    "GetEventsByContractsRequest",
    "GetEventsByContractsResponse",
    "PaginatedResponse",
    "IsIndexerResponse",
    "GetAdminResponse",
    "EventEntry",
    "IndexerStats",
    "AddIndexerRequest",
    "AddIndexerResponse",
    "RecordEventsBatchRequest",
    "RecordEventsBatchResponse",
    "SoroScanError",
    "SoroScanAPIError",
    "SoroScanAuthError",
    "SoroScanNotFoundError",
    "SoroScanRateLimitError",
    "SoroScanValidationError",
    "verify_webhook_signature",
]
