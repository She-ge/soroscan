"""Opt-in chaos engineering harness for SoroScan Kubernetes and Compose.

Dry-run (default) validates scenario definitions and constructed commands.
Disruptive actions require ``--execute`` and ``SOROSCAN_CHAOS_RUN=1``. Production
environments and blocked namespaces are rejected.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

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

from testing.reliability.health import wait_for_http_status
from testing.reliability.safety import SafetyError, assert_safe_chaos_environment

ROOT = Path(__file__).resolve().parent
DEFAULT_SCENARIOS = ROOT / "scenarios.yaml"
SUPPORTED_ACTIONS = {
    "pod_termination",
    "network_latency",
    "memory_exhaustion",
    "cpu_throttling",
}


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    namespace: str
    selector: str
    action: dict[str, Any]
    recovery: dict[str, Any]
    expected: dict[str, Any]


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
            expected=raw.get("expected") or {},
        )
        validate_scenario(scenario)
        scenarios.append(scenario)
    if not scenarios:
        raise ChaosError("No chaos scenarios were defined.")
    return scenarios


def validate_scenario(scenario: Scenario) -> None:
    action_type = scenario.action.get("type")
    if action_type not in SUPPORTED_ACTIONS:
        raise ChaosError(f"Unsupported action type for {scenario.name}: {action_type}")
    if not scenario.namespace:
        raise ChaosError(f"Scenario {scenario.name} requires namespace")
    if not scenario.selector:
        raise ChaosError(f"Scenario {scenario.name} requires selector")
    if not scenario.recovery.get("url"):
        raise ChaosError(f"Scenario {scenario.name} requires recovery.url")
    if int(scenario.recovery.get("timeout_seconds", 0)) <= 0:
        raise ChaosError(
            f"Scenario {scenario.name} requires positive recovery.timeout_seconds"
        )
    if not scenario.expected.get("behavior"):
        raise ChaosError(f"Scenario {scenario.name} requires expected.behavior")
    if not scenario.expected.get("cleanup"):
        raise ChaosError(f"Scenario {scenario.name} requires expected.cleanup")


def build_commands(scenario: Scenario, backend: str = "kubernetes") -> list[list[str]]:
    if backend == "compose":
        return build_compose_commands(scenario)
    return build_kubernetes_commands(scenario)


def build_kubernetes_commands(scenario: Scenario) -> list[list[str]]:
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
                "--wait=false",
            ]
        ]

    if action_type == "network_latency":
        latency = int(action["latency_ms"])
        duration = int(action.get("duration_seconds", 30))
        deployment = action.get("deployment", "soroscan-backend")
        return [
            [
                "kubectl",
                "-n",
                namespace,
                "exec",
                "deploy/" + deployment,
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
        restore = action.get("restore_limits", {})
        restore_args = []
        if restore.get("cpu") or restore.get("memory"):
            parts = []
            if restore.get("cpu"):
                parts.append(f"cpu={restore['cpu']}")
            if restore.get("memory"):
                parts.append(f"memory={restore['memory']}")
            restore_args = [
                [
                    "kubectl",
                    "-n",
                    namespace,
                    "set",
                    "resources",
                    f"deployment/{deployment}",
                    "--limits",
                    ",".join(parts),
                ]
            ]
        else:
            restore_args = [
                [
                    "kubectl",
                    "-n",
                    namespace,
                    "rollout",
                    "undo",
                    f"deployment/{deployment}",
                ]
            ]
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
            *restore_args,
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


def build_compose_commands(scenario: Scenario) -> list[list[str]]:
    """Compose-local equivalents used by docker-compose.chaos.yml."""
    action_type = scenario.action["type"]
    service = scenario.action.get("compose_service", "web")
    if action_type == "pod_termination":
        return [
            ["docker", "compose", "-f", "docker-compose.chaos.yml", "kill", service],
            ["docker", "compose", "-f", "docker-compose.chaos.yml", "start", service],
        ]
    if action_type == "network_latency":
        latency = int(scenario.action["latency_ms"])
        duration = int(scenario.action.get("duration_seconds", 30))
        return [
            [
                "docker",
                "compose",
                "-f",
                "docker-compose.chaos.yml",
                "exec",
                "-T",
                service,
                "sh",
                "-c",
                f"tc qdisc add dev eth0 root netem delay {latency}ms; "
                f"sleep {duration}; tc qdisc del dev eth0 root || true",
            ]
        ]
    if action_type in {"memory_exhaustion", "cpu_throttling"}:
        limit = (
            scenario.action["memory_limit"]
            if action_type == "memory_exhaustion"
            else scenario.action["cpu_limit"]
        )
        flag = "--memory" if action_type == "memory_exhaustion" else "--cpus"
        duration = int(scenario.action.get("duration_seconds", 30))
        return [
            ["docker", "update", flag, str(limit), service],
            ["sleep", str(duration)],
        ]
    raise ChaosError(f"Unsupported action type: {action_type}")


def run_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    if command[0] == "sleep":
        time.sleep(float(command[1]))
        return subprocess.CompletedProcess(command, 0, "", "")
    return subprocess.run(command, check=True, capture_output=True, text=True)


def run_scenario(
    scenario: Scenario,
    execute: bool,
    backend: str,
) -> dict[str, Any]:
    assert_safe_chaos_environment(scenario.namespace, execute=execute)
    commands = build_commands(scenario, backend=backend)
    result: dict[str, Any] = {
        "scenario": scenario.name,
        "action": scenario.action["type"],
        "backend": backend,
        "namespace": scenario.namespace,
        "execute": execute,
        "expected_behavior": scenario.expected.get("behavior"),
        "cleanup": scenario.expected.get("cleanup"),
        "commands": len(commands),
    }
    if not execute:
        print(f"[dry-run] {scenario.name}: {len(commands)} commands validated")
        return result

    for command in commands:
        run_command(command)
        result["injected"] = True

    wait_for_http_status(
        scenario.recovery["url"],
        int(scenario.recovery.get("healthy_status", 200)),
        timeout_seconds=int(scenario.recovery["timeout_seconds"]),
    )
    result["recovered"] = True
    print(f"[ok] {scenario.name} recovered")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run SoroScan chaos scenarios.")
    parser.add_argument("--scenario", help="Run one scenario by name")
    parser.add_argument("--scenarios-file", type=Path, default=DEFAULT_SCENARIOS)
    parser.add_argument(
        "--backend",
        choices=("kubernetes", "compose"),
        default=os.getenv("SOROSCAN_CHAOS_BACKEND", "kubernetes"),
        help="Execution backend. Compose is isolated to docker-compose.chaos.yml.",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Execute disruptive actions. Also requires SOROSCAN_CHAOS_RUN=1.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=ROOT / "results" / "chaos-summary.json",
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

        results = []
        for scenario in scenarios:
            results.append(
                run_scenario(scenario, execute=execute, backend=args.backend)
            )

        args.report_path.parent.mkdir(parents=True, exist_ok=True)
        args.report_path.write_text(
            json.dumps({"scenarios": results, "execute": execute}, indent=2),
            encoding="utf-8",
        )
    except (ChaosError, SafetyError) as exc:
        print(f"chaos error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
