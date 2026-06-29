"""Opt-in failover validation harness for SoroScan dependency health probes.

The runner validates scenarios by default. It executes live recovery probes only
when SOROSCAN_FAILOVER_RUN=1 is set, making it safe for CI validation.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import yaml


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
    if not scenario.probes.get("readiness_url"):
        raise FailoverError(f"Scenario {scenario.name} requires probes.readiness_url")
    if not scenario.probes.get("worker_health_url"):
        raise FailoverError(
            f"Scenario {scenario.name} requires probes.worker_health_url"
        )
    if not scenario.probes.get("liveness_url"):
        raise FailoverError(f"Scenario {scenario.name} requires probes.liveness_url")
    if int(scenario.recovery.get("timeout_seconds", 0)) <= 0:
        raise FailoverError(
            f"Scenario {scenario.name} requires positive recovery.timeout_seconds"
        )
    if not scenario.recovery.get("url"):
        raise FailoverError(f"Scenario {scenario.name} requires recovery.url")


def probe_url(url: str, timeout_seconds: float = 5.0) -> int:
    try:
        with urlopen(url, timeout=timeout_seconds) as response:
            return response.status
    except HTTPError as exc:
        return exc.code


def wait_for_recovery(url: str, timeout_seconds: int, interval_seconds: float = 2.0) -> None:
    deadline = time.time() + timeout_seconds
    last_error = None
    while time.time() < deadline:
        try:
            status = probe_url(url)
            if 200 <= status < 300:
                return
            last_error = f"unexpected status {status}"
        except URLError as exc:
            last_error = exc
        time.sleep(interval_seconds)
    raise FailoverError(f"Recovery check failed for {url}: {last_error}")


def run_scenario(scenario: Scenario, execute: bool, base_url: str) -> dict[str, Any]:
    probes = dict(scenario.probes)
    for key in ("readiness_url", "worker_health_url", "liveness_url", "recovery_url"):
        if key in probes and isinstance(probes[key], str):
            probes[key] = probes[key].replace("http://127.0.0.1:8000", base_url.rstrip("/"))

    recovery_url = scenario.recovery["url"].replace(
        "http://127.0.0.1:8000", base_url.rstrip("/")
    )

    result = {
        "scenario": scenario.name,
        "failure_type": scenario.failure["type"],
        "component": scenario.failure["component"],
        "execute": execute,
    }

    if not execute:
        print(f"[dry-run] {scenario.name}: probes and recovery validated")
        return result

    try:
        liveness_status = probe_url(probes["liveness_url"])
        readiness_status = probe_url(probes["readiness_url"])
        worker_status = probe_url(probes["worker_health_url"])
    except URLError as exc:
        raise FailoverError(
            f"Baseline probe failed for {scenario.name}: {exc}"
        ) from exc

    healthy_status = int(scenario.probes.get("healthy_status", 200))
    if liveness_status != healthy_status:
        raise FailoverError(
            f"Liveness probe failed for {scenario.name}: status {liveness_status}"
        )
    if readiness_status != healthy_status:
        raise FailoverError(
            f"Readiness probe failed for {scenario.name}: status {readiness_status}"
        )
    if (
        scenario.failure["type"] == "worker"
        and worker_status != healthy_status
    ):
        raise FailoverError(
            f"Worker probe failed for {scenario.name}: status {worker_status}"
        )

    result.update(
        {
            "baseline": {
                "liveness_status": liveness_status,
                "readiness_status": readiness_status,
                "worker_health_status": worker_status,
            }
        }
    )

    wait_for_recovery(recovery_url, int(scenario.recovery["timeout_seconds"]))
    result["recovered"] = True
    print(f"[ok] {scenario.name} recovered")
    return result


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
        if args.execute and not execute:
            raise FailoverError(
                "Set SOROSCAN_FAILOVER_RUN=1 before executing live failover probes."
            )

        results = []
        for scenario in scenarios:
            results.append(run_scenario(scenario, execute=execute, base_url=args.base_url))

        if execute:
            args.report_path.parent.mkdir(parents=True, exist_ok=True)
            args.report_path.write_text(
                json.dumps({"scenarios": results}, indent=2),
                encoding="utf-8",
            )
    except FailoverError as exc:
        print(f"failover error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
