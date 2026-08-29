def filter_sc21_events(events, topic):
    return [e for e in events if e.get("topic") == topic]

def test_sc21_filter():
    events = [
        {"contract_id": "C1", "topic": "transfer", "payload": ["A", "B"]},
        {"contract_id": "C1", "topic": "mint", "payload": ["A"]}
    ]
    res = filter_sc21_events(events, "transfer")
    assert len(res) == 1
    assert res[0]["topic"] == "transfer"
