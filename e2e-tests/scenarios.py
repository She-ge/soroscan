"""Load and validate E2E scenario definitions (issue #519)."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml

DEFAULT_SCENARIOS_PATH = Path(__file__).resolve().parent / "scenarios.yaml"
MIN_COVERAGE_RATIO = 0.80


class ScenarioError(ValueError):
    """Raised when scenario definitions are invalid."""


@dataclass(frozen=True)
class Scenario:
    id: str
    description: str
    critical: bool
    implemented: bool
    test: str


def load_scenarios(path: Path | None = None) -> list[Scenario]:
    scenarios_path = path or DEFAULT_SCENARIOS_PATH
    if not scenarios_path.is_file():
        raise ScenarioError(f"Scenario file not found: {scenarios_path}")

    raw = yaml.safe_load(scenarios_path.read_text(encoding="utf-8")) or {}
    entries = raw.get("scenarios")
    if not isinstance(entries, list) or not entries:
        raise ScenarioError("scenarios.yaml must define a non-empty scenarios list")

    scenarios: list[Scenario] = []
    seen_ids: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict):
            raise ScenarioError("Each scenario must be a mapping")
        scenario_id = entry.get("id")
        if not scenario_id or not isinstance(scenario_id, str):
            raise ScenarioError("Each scenario requires a string id")
        if scenario_id in seen_ids:
            raise ScenarioError(f"Duplicate scenario id: {scenario_id}")
        seen_ids.add(scenario_id)

        scenarios.append(
            Scenario(
                id=scenario_id,
                description=str(entry.get("description", "")),
                critical=bool(entry.get("critical", False)),
                implemented=bool(entry.get("implemented", False)),
                test=str(entry.get("test", "")),
            )
        )

    return scenarios


def critical_scenarios(scenarios: list[Scenario]) -> list[Scenario]:
    return [scenario for scenario in scenarios if scenario.critical]


def coverage_ratio(scenarios: list[Scenario]) -> float:
    critical = critical_scenarios(scenarios)
    if not critical:
        return 0.0
    implemented = sum(1 for scenario in critical if scenario.implemented)
    return implemented / len(critical)


def assert_minimum_coverage(scenarios: list[Scenario], minimum: float = MIN_COVERAGE_RATIO) -> float:
    ratio = coverage_ratio(scenarios)
    if ratio < minimum:
        critical = critical_scenarios(scenarios)
        implemented = [scenario.id for scenario in critical if scenario.implemented]
        missing = [scenario.id for scenario in critical if not scenario.implemented]
        raise ScenarioError(
            f"E2E coverage {ratio:.0%} is below required {minimum:.0%}. "
            f"Implemented: {implemented}. Missing: {missing}."
        )
    return ratio
