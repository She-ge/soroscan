"""
SoroScan Python SDK

Official Python client for the SoroScan API - Stellar/Soroban event indexing.
"""

from soroscan.builder import (
    AsyncContractQueryBuilder,
    AsyncEventQueryBuilder,
    AsyncWebhookQueryBuilder,
    ContractQueryBuilder,
    EventQueryBuilder,
    WebhookQueryBuilder,
)
from soroscan.async_client import AsyncSoroScanClient, AsyncSoroscanClient
from soroscan.client import SoroScanClient
from soroscan.exceptions import (
    SoroScanAPIError,
    SoroScanAuthError,
    SoroScanAuthenticationError,
    SoroScanAuthorizationError,
    SoroScanConnectionError,
    SoroScanError,
    SoroScanNetworkError,
    SoroScanNotFoundError,
    SoroScanRateLimitError,
    SoroScanServerError,
    SoroScanTimeoutError,
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
    GetEventsByContractsRequest,
    GetEventsByContractsResponse,
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
    "AsyncSoroscanClient",
    "EventQueryBuilder",
    "AsyncEventQueryBuilder",
    "ContractQueryBuilder",
    "AsyncContractQueryBuilder",
    "WebhookQueryBuilder",
    "AsyncWebhookQueryBuilder",
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
    "SoroScanAuthenticationError",
    "SoroScanAuthorizationError",
    "SoroScanNotFoundError",
    "SoroScanRateLimitError",
    "SoroScanValidationError",
    "SoroScanServerError",
    "SoroScanNetworkError",
    "SoroScanTimeoutError",
    "SoroScanConnectionError",
    "verify_webhook_signature",
]
