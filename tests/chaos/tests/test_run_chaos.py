from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from run_chaos import ChaosError, build_commands, load_scenarios, main


def test_loads_all_required_scenarios():
    scenarios = load_scenarios(Path(__file__).resolve().parents[1] / "scenarios.yaml")

    names = {scenario.name for scenario in scenarios}

    assert names == {
        "pod_termination",
        "network_latency",
        "memory_exhaustion",
        "cpu_throttling",
    }
    for scenario in scenarios:
        assert scenario.namespace == "chaos-testing"
        assert scenario.expected["behavior"]
        assert scenario.expected["cleanup"]


@pytest.mark.parametrize(
    ("scenario_name", "expected_fragment"),
    [
        ("pod_termination", "delete"),
        ("network_latency", "tc qdisc add"),
        ("memory_exhaustion", "memory=128Mi"),
        ("cpu_throttling", "cpu=100m"),
    ],
)
def test_builds_expected_kubectl_commands(scenario_name, expected_fragment):
    scenarios = load_scenarios(Path(__file__).resolve().parents[1] / "scenarios.yaml")
    scenario = next(item for item in scenarios if item.name == scenario_name)

    commands = build_commands(scenario)
    flattened = " ".join(" ".join(command) for command in commands)

    assert expected_fragment in flattened


def test_resource_experiments_restore_original_limits():
    scenarios = load_scenarios(Path(__file__).resolve().parents[1] / "scenarios.yaml")
    memory = next(item for item in scenarios if item.name == "memory_exhaustion")
    cpu = next(item for item in scenarios if item.name == "cpu_throttling")

    memory_cmds = " ".join(" ".join(cmd) for cmd in build_commands(memory))
    cpu_cmds = " ".join(" ".join(cmd) for cmd in build_commands(cpu))

    assert "memory=512Mi" in memory_cmds
    assert "cpu=1,memory=512Mi" in cpu_cmds or "cpu=1,memory=512Mi" in memory_cmds
    assert "--limits cpu=1,memory=512Mi" in cpu_cmds.replace("  ", " ") or "cpu=1,memory=512Mi" in cpu_cmds


def test_compose_backend_uses_isolated_compose_file():
    scenarios = load_scenarios(Path(__file__).resolve().parents[1] / "scenarios.yaml")
    scenario = next(item for item in scenarios if item.name == "pod_termination")
    commands = build_commands(scenario, backend="compose")
    flattened = " ".join(" ".join(command) for command in commands)
    assert "docker-compose.chaos.yml" in flattened
    assert "kill" in flattened


def test_execute_requires_explicit_environment_flag(monkeypatch):
    monkeypatch.delenv("SOROSCAN_CHAOS_RUN", raising=False)

    assert main(["--execute"]) == 1


def test_execute_rejects_production_environment(monkeypatch):
    monkeypatch.setenv("SOROSCAN_CHAOS_RUN", "1")
    monkeypatch.setenv("SOROSCAN_ENVIRONMENT", "production")
    assert main(["--execute"]) == 1


def test_unknown_scenario_fails_cleanly():
    assert main(["--scenario", "missing"]) == 1


def test_invalid_scenario_file_fails(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text(
        """
scenarios:
  - name: bad
    namespace: chaos-testing
    selector: app=soroscan-backend
    action: {type: unknown}
    expected: {behavior: x, cleanup: y}
    recovery: {url: http://127.0.0.1:8000/ready/, timeout_seconds: 1}
""",
        encoding="utf-8",
    )

    with pytest.raises(ChaosError):
        load_scenarios(path)
