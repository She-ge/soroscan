#!/usr/bin/env python
"""
Standalone script to generate API endpoint documentation from view docstrings.

Usage:
    python scripts/generate_api_docs.py
    python scripts/generate_api_docs.py --format json --output docs/api_reference.json
    python scripts/generate_api_docs.py --stdout --no-examples

Equivalent to: python manage.py generate_api_docs [options]
"""
from __future__ import annotations

import os
import sys


def main() -> int:
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "soroscan.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(["manage.py", "generate_api_docs", *sys.argv[1:]])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
