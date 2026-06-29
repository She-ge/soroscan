# SoroScan SDKs

Official SDKs for the SoroScan API - Stellar/Soroban event indexing.

## Strict type verification

```bash
cd typescript && npm run typecheck
cd ../python && python -m mypy soroscan
```

The TypeScript SDK enables `strict`, `strictNullChecks`, and
`noUncheckedIndexedAccess`, and contains no explicit `any` types. The Python
SDK uses mypy strict mode and requires annotations for every function.

## Available SDKs

### Python SDK

**Status**: ✅ Complete and ready for production

**Location**: `sdk/python/`

**Features**:
- Synchronous and asynchronous clients
- Full REST API coverage (15 endpoints)
- 100% type hint coverage with mypy strict
- Pydantic v2 models for type safety
- Comprehensive test suite (42+ tests)
- Python 3.10+ support

**Installation**:
```bash
pip install soroscan-sdk
```

**Quick Start**:
```python
from soroscan import SoroScanClient

client = SoroScanClient(base_url="https://api.soroscan.io", api_key="...")
events = client.get_events(contract_id="CCAAA...", event_type="transfer")
```

**Documentation**: See [python/README.md](python/README.md)

## Future SDKs

### JavaScript/TypeScript SDK
- Status: Planned
- Target: Node.js and browser support
- Features: TypeScript types, Promise-based API

### Rust SDK
- Status: Planned
- Target: Native Stellar/Soroban integration
- Features: Zero-cost abstractions, async/await

### Go SDK
- Status: Planned
- Target: Backend services
- Features: Goroutine support, context handling

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## Support

- GitHub Issues: https://github.com/soroscan/soroscan/issues
- Email: team@soroscan.io
- Documentation: https://docs.soroscan.io

## License

All SDKs are released under the MIT License.
