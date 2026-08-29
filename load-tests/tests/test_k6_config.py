"""Static checks for the k6 load-testing framework."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SMOKE = (ROOT / "k6" / "smoke.js").read_text(encoding="utf-8")
SCENARIOS = (ROOT / "k6" / "scenarios.js").read_text(encoding="utf-8")
SAFETY = (ROOT / "k6" / "lib" / "safety.js").read_text(encoding="utf-8")


def test_smoke_and_scenarios_import_production_guard():
    assert 'from "./lib/safety.js"' in SMOKE
    assert 'from "./lib/safety.js"' in SCENARIOS
    assert "assertSafeTarget" in SMOKE
    assert "assertSafeTarget" in SCENARIOS
    assert "ALLOW_PRODUCTION_LOAD" in SAFETY


def test_scripts_are_configurable():
    for source in (SMOKE, SCENARIOS):
        assert "BASE_URL" in source
        assert "K6_DURATION" in source
        assert "handleSummary" in source
        assert "K6_REPORT_PATH" in source


def test_scenarios_cover_discovered_api_workflows():
    for fragment in (
        "/api/ingest/health/",
        "/api/ingest/contracts/",
        "/api/ingest/events/",
        "/api/ingest/webhooks/",
        "/api/ingest/compliance-export/",
        "/api/token/",
        "/v1/events",
        "/graphql/",
        "K6_RAMP_UP",
        "K6_VUS",
        "K6_API_TOKEN",
    ):
        assert fragment in SCENARIOS


def test_safety_blocks_known_production_hosts():
    assert "api.soroscan.io" in SAFETY
    assert "soroscan.io" in SAFETY
