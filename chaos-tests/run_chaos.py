"""Opt-in chaos engineering harness for SoroScan Kubernetes deployments.

The runner validates scenarios by default. It executes disruptive actions only
when SOROSCAN_CHAOS_RUN=1 is set, making it safe for CI validation.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen

import yaml


ROOT = Path(__file__).resolve().parent
DEFAULT_SCENARIOS = ROOT / "scenarios.yaml"


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    namespace: str
    selector: str
    action: dict[str, Any]
    recovery: dict[str, Any]


class ChaosError(RuntimeError):
    """Raised when a chaos scenario cannot be validated or executed."""


def load_scenarios(path: Path = DEFAULT_SCENARIOS) -> list[Scenario]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    scenarios = []
    for raw in data.get("scenarios", []):
        scenario = Scenario(
            name=raw["name"],
            description=raw.get("description", ""),
            namespace=raw["namespace"],
            selector=raw["selector"],
            action=raw["action"],
            recovery=raw["recovery"],
        )
        validate_scenario(scenario)
        scenarios.append(scenario)
    if not scenarios:
        raise ChaosError("No chaos scenarios were defined.")
    return scenarios


def validate_scenario(scenario: Scenario) -> None:
    action_type = scenario.action.get("type")
    supported = {
        "pod_termination",
        "network_latency",
        "memory_exhaustion",
        "cpu_throttling",
    }
    if action_type not in supported:
        raise ChaosError(f"Unsupported action type for {scenario.name}: {action_type}")
    if not scenario.recovery.get("url"):
        raise ChaosError(f"Scenario {scenario.name} requires recovery.url")
    if int(scenario.recovery.get("timeout_seconds", 0)) <= 0:
        raise ChaosError(f"Scenario {scenario.name} requires positive recovery.timeout_seconds")


def build_commands(scenario: Scenario) -> list[list[str]]:
    action = scenario.action
    action_type = action["type"]
    namespace = scenario.namespace
    selector = scenario.selector

    if action_type == "pod_termination":
        return [
            [
                "kubectl",
                "-n",
                namespace,
                "delete",
                "pod",
                "-l",
                selector,
                "--field-selector=status.phase=Running",
            ]
        ]

    if action_type == "network_latency":
        latency = int(action["latency_ms"])
        duration = int(action.get("duration_seconds", 30))
        return [
            [
                "kubectl",
                "-n",
                namespace,
                "exec",
                "deploy/" + action.get("deployment", "soroscan-backend"),
                "--",
                "sh",
                "-c",
                f"tc qdisc add dev eth0 root netem delay {latency}ms; "
                f"sleep {duration}; tc qdisc del dev eth0 root || true",
            ]
        ]

    if action_type in {"memory_exhaustion", "cpu_throttling"}:
        deployment = action["deployment"]
        resource = (
            f"memory={action['memory_limit']}"
            if action_type == "memory_exhaustion"
            else f"cpu={action['cpu_limit']}"
        )
        duration = int(action.get("duration_seconds", 30))
        return [
            [
                "kubectl",
                "-n",
                namespace,
                "set",
                "resources",
                f"deployment/{deployment}",
                "--limits",
                resource,
            ],
            ["sleep", str(duration)],
            [
                "kubectl",
                "-n",
                namespace,
                "rollout",
                "restart",
                f"deployment/{deployment}",
            ],
            [
                "kubectl",
                "-n",
                namespace,
                "rollout",
                "status",
                f"deployment/{deployment}",
                "--timeout=120s",
            ],
        ]

    raise ChaosError(f"Unsupported action type: {action_type}")


def wait_for_recovery(url: str, timeout_seconds: int, interval_seconds: float = 2.0) -> None:
    deadline = time.time() + timeout_seconds
    last_error = None
    while time.time() < deadline:
        try:
            with urlopen(url, timeout=5) as response:
                if 200 <= response.status < 500:
                    return
        except URLError as exc:
            last_error = exc
        time.sleep(interval_seconds)
    raise ChaosError(f"Recovery check failed for {url}: {last_error}")


def run_command(command: list[str]) -> None:
    subprocess.run(command, check=True)


def run_scenario(scenario: Scenario, execute: bool) -> None:
    commands = build_commands(scenario)
    if not execute:
        print(f"[dry-run] {scenario.name}: {len(commands)} commands validated")
        return
    for command in commands:
        run_command(command)
    wait_for_recovery(
        scenario.recovery["url"],
        int(scenario.recovery["timeout_seconds"]),
    )
    print(f"[ok] {scenario.name} recovered")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run SoroScan chaos scenarios.")
    parser.add_argument("--scenario", help="Run one scenario by name")
    parser.add_argument("--scenarios-file", type=Path, default=DEFAULT_SCENARIOS)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Execute disruptive actions. Also requires SOROSCAN_CHAOS_RUN=1.",
    )
    args = parser.parse_args(argv)

    try:
        scenarios = load_scenarios(args.scenarios_file)
        if args.scenario:
            scenarios = [item for item in scenarios if item.name == args.scenario]
            if not scenarios:
                raise ChaosError(f"Unknown scenario: {args.scenario}")

        execute = args.execute and os.getenv("SOROSCAN_CHAOS_RUN") == "1"
        if args.execute and not execute:
            raise ChaosError("Set SOROSCAN_CHAOS_RUN=1 before executing chaos actions.")

        for scenario in scenarios:
            run_scenario(scenario, execute=execute)
    except ChaosError as exc:
        print(f"chaos error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
