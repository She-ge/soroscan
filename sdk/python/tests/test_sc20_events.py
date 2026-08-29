import pytest

def parse_sc20_event(raw_event: dict) -> dict:
    return {
        "contract_id": str(raw_event.get("contractId", "")),
        "topic": str(raw_event.get("topic", "unknown")),
        "data": raw_event.get("data"),
        "timestamp": int(raw_event.get("timestamp", 0))
    }

def test_sc20_event_parser():
    raw = {"contractId": "C123", "topic": "draw", "data": {"winner": "G123"}, "timestamp": 1700000000}
    parsed = parse_sc20_event(raw)
    assert parsed["contract_id"] == "C123"
    assert parsed["topic"] == "draw"
    assert parsed["timestamp"] == 1700000000
