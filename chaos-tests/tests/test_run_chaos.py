from pathlib import Path

import pytest

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


def test_execute_requires_explicit_environment_flag(monkeypatch):
    monkeypatch.delenv("SOROSCAN_CHAOS_RUN", raising=False)

    assert main(["--execute"]) == 1


def test_unknown_scenario_fails_cleanly():
    assert main(["--scenario", "missing"]) == 1


def test_invalid_scenario_file_fails(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text(
        """
scenarios:
  - name: bad
    namespace: soroscan
    selector: app=soroscan-backend
    action: {type: unknown}
    recovery: {url: http://127.0.0.1:8000/ready/, timeout_seconds: 1}
""",
        encoding="utf-8",
    )

    with pytest.raises(ChaosError):
        load_scenarios(path)
