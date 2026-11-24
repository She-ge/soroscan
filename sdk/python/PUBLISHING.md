# Publishing Guide

Instructions for publishing the SoroScan SDK to PyPI.

## Prerequisites

1. Install build tools:

```bash
pip install build twine
```

1. Create PyPI account at <https://pypi.org>

1. Configure PyPI credentials:

```bash
# Create ~/.pypirc
[pypi]
username = __token__
password = pypi-...your-token...
```

## Pre-Release Checklist

- [ ] All tests pass: `pytest tests/ -v`
- [ ] Type checking passes: `mypy soroscan/ --strict`
- [ ] Linting passes: `ruff check soroscan/`
- [ ] Version updated in `pyproject.toml`
- [ ] CHANGELOG updated
- [ ] README reviewed
- [ ] Examples tested

## Build Package

```bash
# Clean previous builds
make clean

# Build distribution
make build
```

This creates:

- `dist/soroscan_sdk-X.Y.Z-py3-none-any.whl`
- `dist/soroscan-sdk-X.Y.Z.tar.gz`

## Test Package Locally

```bash
# Install from local build
pip install dist/soroscan_sdk-*.whl

# Test import
python -c "from soroscan import SoroScanClient; print('OK')"
```

## Publish to Test PyPI

```bash
# Upload to test.pypi.org
python -m twine upload --repository testpypi dist/*

# Test installation
pip install --index-url https://test.pypi.org/simple/ soroscan-sdk
```

## Publish to PyPI

```bash
# Upload to pypi.org
make publish

# Or manually:
python -m twine upload dist/*
```

## Verify Publication

```bash
# Install from PyPI
pip install soroscan-sdk

# Verify version
python -c "import soroscan; print(soroscan.__version__)"
```

## Post-Release

1. Create GitHub release with tag `v{version}`
1. Update documentation site
1. Announce on community channels

## Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

Examples:

- `0.1.0` - Initial release
- `0.1.1` - Bug fix
- `0.2.0` - New features
- `1.0.0` - Stable API
