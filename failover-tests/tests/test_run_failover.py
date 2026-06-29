from pathlib import Path

import pytest

from run_failover import FailoverError, load_scenarios, main


def test_loads_all_required_scenarios():
    scenarios = load_scenarios(Path(__file__).resolve().parents[1] / "scenarios.yaml")

    names = {scenario.name for scenario in scenarios}

    assert names == {
        "database_connection_failure",
        "redis_connection_failure",
        "rpc_timeout",
        "multiple_worker_failures",
    }


@pytest.mark.parametrize(
    "scenario_name",
    [
        "database_connection_failure",
        "redis_connection_failure",
        "rpc_timeout",
        "multiple_worker_failures",
    ],
)
def test_each_scenario_declares_recovery_probe(scenario_name):
    scenarios = load_scenarios(Path(__file__).resolve().parents[1] / "scenarios.yaml")
    scenario = next(item for item in scenarios if item.name == scenario_name)

    assert scenario.recovery["url"]
    assert scenario.probes["readiness_url"]
    assert scenario.probes["worker_health_url"]
    assert scenario.probes["liveness_url"]
    assert scenario.failure["component"]


def test_execute_requires_explicit_environment_flag(monkeypatch):
    monkeypatch.delenv("SOROSCAN_FAILOVER_RUN", raising=False)

    assert main(["--execute"]) == 1


def test_unknown_scenario_fails_cleanly():
    assert main(["--scenario", "missing"]) == 1


def test_exclude_scenario_skips_matching_entries():
    assert (
        main(
            [
                "--exclude-scenario",
                "database_connection_failure",
                "--exclude-scenario",
                "redis_connection_failure",
                "--exclude-scenario",
                "rpc_timeout",
                "--exclude-scenario",
                "multiple_worker_failures",
            ]
        )
        == 1
    )


def test_invalid_scenario_file_fails(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text(
        """
scenarios:
  - name: bad
    description: invalid
    failure: {type: unknown, component: database}
    probes:
      readiness_url: http://127.0.0.1:8000/ready/
      worker_health_url: http://127.0.0.1:8000/api/health/workers/
      liveness_url: http://127.0.0.1:8000/health/
    recovery: {url: http://127.0.0.1:8000/ready/, timeout_seconds: 1}
""",
        encoding="utf-8",
    )

    with pytest.raises(FailoverError):
        load_scenarios(path)
