# Changelog

All notable changes to the SoroScan Python SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-22

### Added

- Initial release of SoroScan Python SDK
- `SoroScanClient` - Synchronous HTTP client
- `AsyncSoroScanClient` - Asynchronous HTTP client with asyncio/trio support
- Full REST API coverage:
  - Contract management (CRUD operations)
  - Event querying with flexible filtering
  - Webhook subscriptions
  - Contract statistics
  - Event recording
- Pydantic v2 models for type-safe responses:
  - `TrackedContract`
  - `ContractEvent`
  - `WebhookSubscription`
  - `ContractStats`
  - `PaginatedResponse[T]`
- Comprehensive exception hierarchy:
  - `SoroScanError` (base)
  - `SoroScanAPIError`
  - `SoroScanAuthError`
  - `SoroScanNotFoundError`
  - `SoroScanRateLimitError`
  - `SoroScanValidationError`
- 100% type hint coverage with mypy --strict
- Context manager support for automatic cleanup
- Python 3.10+ support
- Comprehensive test suite with >90% coverage
- Example scripts for common use cases
- Full documentation and API reference

### Dependencies

- httpx >= 0.27.0 (sync and async HTTP)
- pydantic >= 2.0.0 (data validation)

[0.1.0]: https://github.com/soroscan/soroscan/releases/tag/v0.1.0
