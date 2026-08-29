def verify_sc36_payload(payload):
    return isinstance(payload.get("version"), str) and len(payload.get("version", "")) > 0

def test_sc36_verifier():
    assert verify_sc36_payload({"version": "1.0", "data": {}}) is True
    assert verify_sc36_payload({"version": "", "data": {}}) is False
