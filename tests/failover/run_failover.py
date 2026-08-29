"""Automated failover validation and live recovery harness.

Dry-run (default) only validates scenario definitions. Live execution requires
both ``--execute`` and ``SOROSCAN_FAILOVER_RUN=1``. When a scenario declares an
injector, the runner actually takes the dependency down, waits for the
readiness probe to degrade, restores the dependency, then waits for recovery.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import URLError

import yaml


def _repo_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in [here, *here.parents]:
        if (candidate / "django-backend" / "manage.py").is_file():
            return candidate
    raise RuntimeError("Could not locate the SoroScan repository root")


REPO_ROOT = _repo_root()
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from testing.reliability.health import probe_url, wait_for_http_status
from testing.reliability.inject import FailureInjector, InjectionError
from testing.reliability.safety import SafetyError, assert_safe_failover_environment

ROOT = Path(__file__).resolve().parent
DEFAULT_SCENARIOS = ROOT / "scenarios.yaml"
SUPPORTED_FAILURE_TYPES = {
    "database",
    "redis",
    "rpc_timeout",
    "worker",
}


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    failure: dict[str, Any]
    probes: dict[str, Any]
    recovery: dict[str, Any]
    injector: dict[str, Any] | None = None


class FailoverError(RuntimeError):
    """Raised when a failover scenario cannot be validated or executed."""


def load_scenarios(path: Path = DEFAULT_SCENARIOS) -> list[Scenario]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    scenarios = []
    for raw in data.get("scenarios", []):
        scenario = Scenario(
            name=raw["name"],
            description=raw.get("description", ""),
            failure=raw["failure"],
            probes=raw["probes"],
            recovery=raw["recovery"],
            injector=raw.get("injector"),
        )
        validate_scenario(scenario)
        scenarios.append(scenario)
    if not scenarios:
        raise FailoverError("No failover scenarios were defined.")
    return scenarios


def validate_scenario(scenario: Scenario) -> None:
    failure_type = scenario.failure.get("type")
    if failure_type not in SUPPORTED_FAILURE_TYPES:
        raise FailoverError(
            f"Unsupported failure type for {scenario.name}: {failure_type}"
        )
    if not scenario.failure.get("component"):
        raise FailoverError(f"Scenario {scenario.name} requires failure.component")
    for key in ("readiness_url", "worker_health_url", "liveness_url"):
        if not scenario.probes.get(key):
            raise FailoverError(f"Scenario {scenario.name} requires probes.{key}")
    if int(scenario.recovery.get("timeout_seconds", 0)) <= 0:
        raise FailoverError(
            f"Scenario {scenario.name} requires positive recovery.timeout_seconds"
        )
    if not scenario.recovery.get("url"):
        raise FailoverError(f"Scenario {scenario.name} requires recovery.url")
    injector = FailureInjector.from_mapping(scenario.injector)
    if scenario.injector and injector is None:
        raise FailoverError(f"Scenario {scenario.name} has an incomplete injector block")


def _rewrite(url: str, base_url: str) -> str:
    return url.replace("http://127.0.0.1:8000", base_url.rstrip("/"))


def run_scenario(scenario: Scenario, execute: bool, base_url: str) -> dict[str, Any]:
    probes = {
        key: _rewrite(value, base_url) if isinstance(value, str) else value
        for key, value in scenario.probes.items()
    }
    recovery_url = _rewrite(scenario.recovery["url"], base_url)
    degraded_status = int(scenario.probes.get("degraded_status", 503))
    healthy_status = int(scenario.probes.get("healthy_status", 200))

    result: dict[str, Any] = {
        "scenario": scenario.name,
        "failure_type": scenario.failure["type"],
        "component": scenario.failure["component"],
        "execute": execute,
    }

    if not execute:
        print(f"[dry-run] {scenario.name}: probes, injector, and recovery validated")
        return result

    try:
        liveness_status = probe_url(probes["liveness_url"])
        readiness_status = probe_url(probes["readiness_url"])
        worker_status = probe_url(probes["worker_health_url"])
    except URLError as exc:
        raise FailoverError(f"Baseline probe failed for {scenario.name}: {exc}") from exc

    if liveness_status != healthy_status:
        raise FailoverError(
            f"Liveness probe failed for {scenario.name}: status {liveness_status}"
        )
    if readiness_status != healthy_status:
        raise FailoverError(
            f"Readiness probe failed for {scenario.name}: status {readiness_status}"
        )
    if scenario.failure["type"] == "worker" and worker_status != healthy_status:
        raise FailoverError(
            f"Worker probe failed for {scenario.name}: status {worker_status}"
        )

    result["baseline"] = {
        "liveness_status": liveness_status,
        "readiness_status": readiness_status,
        "worker_health_status": worker_status,
    }

    injector = FailureInjector.from_mapping(scenario.injector)
    injected = False
    try:
        if injector is not None:
            injector.inject()
            injected = True
            degrade_url = probes["readiness_url"]
            if scenario.failure["type"] == "worker":
                degrade_url = probes["worker_health_url"]
            degraded = wait_for_http_status(
                degrade_url,
                degraded_status,
                timeout_seconds=int(scenario.recovery["timeout_seconds"]),
            )
            result["degraded_status"] = degraded
            injector.restore()
            injected = False
            result["restored"] = True
        wait_for_http_status(
            recovery_url,
            healthy_status,
            timeout_seconds=int(scenario.recovery["timeout_seconds"]),
        )
        result["recovered"] = True
        print(f"[ok] {scenario.name} recovered")
        return result
    except (InjectionError, TimeoutError) as exc:
        raise FailoverError(f"{scenario.name} failed: {exc}") from exc
    finally:
        if injector is not None and injected:
            try:
                injector.restore()
            except InjectionError as exc:
                print(f"[warn] restore failed for {scenario.name}: {exc}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run SoroScan failover scenarios.")
    parser.add_argument("--scenario", help="Run one scenario by name")
    parser.add_argument(
        "--exclude-scenario",
        action="append",
        default=[],
        help="Skip one or more scenarios by name",
    )
    parser.add_argument("--scenarios-file", type=Path, default=DEFAULT_SCENARIOS)
    parser.add_argument(
        "--base-url",
        default=os.getenv("BASE_URL", "http://127.0.0.1:8000"),
        help="API base URL for live recovery probes",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Execute live recovery probes. Also requires SOROSCAN_FAILOVER_RUN=1.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=ROOT / "results" / "failover-summary.json",
        help="Optional JSON report path when executing probes",
    )
    args = parser.parse_args(argv)

    try:
        assert_safe_failover_environment(args.base_url, execute=args.execute)
        scenarios = load_scenarios(args.scenarios_file)
        if args.scenario:
            scenarios = [item for item in scenarios if item.name == args.scenario]
            if not scenarios:
                raise FailoverError(f"Unknown scenario: {args.scenario}")
        if args.exclude_scenario:
            excluded = set(args.exclude_scenario)
            scenarios = [item for item in scenarios if item.name not in excluded]
            if not scenarios:
                raise FailoverError("All scenarios were excluded.")

        execute = args.execute and os.getenv("SOROSCAN_FAILOVER_RUN") == "1"
        results = []
        for scenario in scenarios:
            results.append(run_scenario(scenario, execute=execute, base_url=args.base_url))

        args.report_path.parent.mkdir(parents=True, exist_ok=True)
        args.report_path.write_text(
            json.dumps({"scenarios": results, "execute": execute}, indent=2),
            encoding="utf-8",
        )
    except (FailoverError, SafetyError) as exc:
        print(f"failover error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
