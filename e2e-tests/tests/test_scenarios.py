from pathlib import Path

import pytest

from scenarios import (
    MIN_COVERAGE_RATIO,
    ScenarioError,
    assert_minimum_coverage,
    coverage_ratio,
    load_scenarios,
)


def test_loads_all_critical_workflows():
    scenarios = load_scenarios()

    ids = {scenario.id for scenario in scenarios}
    assert ids == {
        "user_signup_to_viewing_events",
        "webhook_subscription_lifecycle",
        "compliance_data_export",
        "admin_ingest_error_review",
        "api_key_lifecycle",
    }


def test_e2e_coverage_meets_eighty_percent_threshold():
    scenarios = load_scenarios()
    ratio = assert_minimum_coverage(scenarios, MIN_COVERAGE_RATIO)

    assert ratio >= 0.80
    assert coverage_ratio(scenarios) == 0.80


@pytest.mark.parametrize(
    "scenario_id",
    [
        "user_signup_to_viewing_events",
        "webhook_subscription_lifecycle",
        "compliance_data_export",
        "admin_ingest_error_review",
    ],
)
def test_implemented_scenarios_declare_pytest_target(scenario_id):
    scenarios = load_scenarios()
    scenario = next(item for item in scenarios if item.id == scenario_id)

    assert scenario.implemented is True
    assert scenario.test.startswith("soroscan.ingest.tests.test_e2e_workflows::")


def test_invalid_scenario_file_fails(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text("scenarios: []\n", encoding="utf-8")

    with pytest.raises(ScenarioError):
        load_scenarios(path)


def test_ci_workflow_exists():
    workflow = Path(__file__).resolve().parents[2] / ".github/workflows/e2e-tests.yml"
    assert workflow.is_file()
    content = workflow.read_text(encoding="utf-8")
    assert "e2e-tests" in content
    assert "test_e2e_workflows" in content
