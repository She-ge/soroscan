import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from soroscan.webhook_verification import verify_webhook_signature


def test_sdk_verify_webhook_signature():
    payload = b'{"hello":"world"}'
    private_key = Ed25519PrivateKey.generate()
    signature = base64.b64encode(private_key.sign(payload)).decode("ascii")
    public_key = base64.b64encode(
        private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
    ).decode("ascii")
    assert verify_webhook_signature(payload, f"ed25519={signature}", public_key)
