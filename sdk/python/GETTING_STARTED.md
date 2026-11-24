# Getting Started with SoroScan SDK Development

Complete guide for setting up and testing the SDK.

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Git (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/soroscan/soroscan.git
cd soroscan/sdk/python
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
# Install package in development mode with dev dependencies
pip install -e ".[dev]"
```

This installs:

- The SDK package (editable)
- httpx (HTTP client)
- pydantic (data validation)
- pytest (testing)
- mypy (type checking)
- ruff (linting)

## Verify Installation

```bash
# Run verification script
python verify_package.py
```

Expected output:

```
✓ All required files present
✓ All imports successful
✓ Type hints present
✓ Package verification successful!
```

## Running Tests

### All Tests

```bash
pytest tests/ -v
```

### With Coverage

```bash
pytest tests/ -v --cov=soroscan --cov-report=html
```

View coverage report: `open htmlcov/index.html`

### Specific Test File

```bash
pytest tests/test_client.py -v
```

### Async Tests Only

```bash
pytest tests/test_async_client.py -v
```

## Type Checking

```bash
mypy soroscan/ --strict
```

Should show: `Success: no issues found`

## Linting

```bash
# Check for issues
ruff check soroscan/ tests/

# Auto-fix issues
ruff check soroscan/ tests/ --fix

# Format code
ruff format soroscan/ tests/
```

## Running All Checks

```bash
# Using Makefile
make all

# Or using Python script
python run_tests.py
```

## Using the SDK

### Basic Example

Create a file `test_sdk.py`:

```python
from soroscan import SoroScanClient

# Initialize client
client = SoroScanClient(
    base_url="https://api.soroscan.io",
    api_key="your-api-key"  # Optional
)

# List contracts
contracts = client.get_contracts(is_active=True)
print(f"Found {contracts.count} contracts")

# Close client
client.close()
```

Run it:

```bash
python test_sdk.py
```

### Async Example

Create `test_async.py`:

```python
import asyncio
from soroscan import AsyncSoroScanClient

async def main():
    async with AsyncSoroScanClient(base_url="https://api.soroscan.io") as client:
        contracts = await client.get_contracts()
        print(f"Found {contracts.count} contracts")

asyncio.run(main())
```

Run it:

```bash
python test_async.py
```

## Building the Package

### Build Distribution

```bash
make build
```

This creates:

- `dist/soroscan_sdk-0.1.0-py3-none-any.whl`
- `dist/soroscan-sdk-0.1.0.tar.gz`

### Install Locally

```bash
pip install dist/soroscan_sdk-*.whl
```

### Test Installation

```bash
python -c "from soroscan import SoroScanClient; print('OK')"
```

## Development Workflow

1. Make changes to code
1. Run tests: `pytest tests/ -v`
1. Check types: `mypy soroscan/ --strict`
1. Format code: `ruff format soroscan/`
1. Commit changes

## Common Issues

### Import Errors

If you see `ModuleNotFoundError`:

```bash
# Reinstall in development mode
pip install -e ".[dev]"
```

### Type Check Failures

If mypy fails:

```bash
# Check specific file
mypy soroscan/client.py --strict

# Show error codes
mypy soroscan/ --strict --show-error-codes
```

### Test Failures

If tests fail:

```bash
# Run with verbose output
pytest tests/ -vv

# Run specific test
pytest tests/test_client.py::test_get_contracts -v

# Show print statements
pytest tests/ -v -s
```

## IDE Setup

### VS Code

Install extensions:

- Python
- Pylance
- Ruff

Settings (`.vscode/settings.json`):

```json
{
  "python.linting.enabled": true,
  "python.linting.mypyEnabled": true,
  "python.formatting.provider": "none",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true
  }
}
```

### PyCharm

1. Mark `soroscan/` as Sources Root
1. Enable mypy plugin
1. Configure Ruff as external tool

## Next Steps

- Read [README.md](README.md) for API documentation
- Check [examples/](examples/) for usage patterns
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Review [README_DEV.md](README_DEV.md) for architecture details

## Getting Help

- Check existing issues: <https://github.com/soroscan/soroscan/issues>
- Create new issue with reproduction steps
- Email: <team@soroscan.io>
