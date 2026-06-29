"""
Tests for Contract model and serializer validation rules (issue #590).
"""
import pytest
from django.core.exceptions import ValidationError

from soroscan.ingest.models import TrackedContract
from soroscan.ingest.serializers import TrackedContractSerializer
from soroscan.ingest.tests.factories import TrackedContractFactory, UserFactory


@pytest.mark.django_db
class TestContractAddressValidation:
    def setup_method(self):
        self.user = UserFactory()

    def test_valid_soroban_address(self):
        """A valid 56-character Base32 string starting with C should pass validation."""
        valid_address = "CABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGH"  # 56 chars
        # Ensure it actually fits the valid regex (A-Z, 2-7) - no 0,1,8,9
        valid_address = "C" + "A" * 55  # exactly 56 chars, all valid Base32
        
        contract = TrackedContract(
            contract_id=valid_address,
            name="Test Contract",
            owner=self.user,
        )
        # Should not raise
        contract.full_clean()

    def test_invalid_prefix(self):
        """Addresses starting with 'G' (classic accounts) should fail validation."""
        invalid_address = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTU"  # 56 chars, G prefix
        contract = TrackedContract(
            contract_id=invalid_address,
            name="Test Contract",
            owner=self.user,
        )
        with pytest.raises(ValidationError) as exc:
            contract.full_clean()
        assert "contract_id" in exc.value.error_dict
        assert "Contract address must start with 'C'" in str(exc.value)

    def test_too_short(self):
        """Addresses under 56 characters should fail validation."""
        short_address = "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST"  # 55 chars
        contract = TrackedContract(
            contract_id=short_address,
            name="Test Contract",
            owner=self.user,
        )
        with pytest.raises(ValidationError) as exc:
            contract.full_clean()
        assert "contract_id" in exc.value.error_dict

    def test_too_long(self):
        """Addresses over 56 characters should fail validation."""
        long_address = "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV"  # 57 chars
        contract = TrackedContract(
            contract_id=long_address,
            name="Test Contract",
            owner=self.user,
        )
        with pytest.raises(ValidationError) as exc:
            contract.full_clean()
        assert "contract_id" in exc.value.error_dict

    def test_invalid_charset(self):
        """Addresses containing invalid Base32 characters (0, 1, 8, 9, lowercase) should fail."""
        invalid_chars = [
            "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS00",  # contains '0'
            "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS11",  # contains '1'
            "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS88",  # contains '8'
            "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS99",  # contains '9'
            "Cabcdefghijklmnopqrstuvwxyz234567abcdefghijklmnopqrstu",  # lowercase
            "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS!@",  # special chars
        ]
        
        for invalid_address in invalid_chars:
            contract = TrackedContract(
                contract_id=invalid_address,
                name="Test Contract",
                owner=self.user,
            )
            with pytest.raises(ValidationError) as exc:
                contract.full_clean()
            assert "contract_id" in exc.value.error_dict

    def test_empty_and_whitespace(self):
        """Empty strings and strings with whitespace should fail validation."""
        invalid_addresses = [
            "",
            " " * 56,
            "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST ",  # trailing space
            " CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST",  # leading space
        ]

        for invalid_address in invalid_addresses:
            contract = TrackedContract(
                contract_id=invalid_address,
                name="Test Contract",
                owner=self.user,
            )
            with pytest.raises(ValidationError) as exc:
                contract.full_clean()
            assert "contract_id" in exc.value.error_dict


# ── Serializer-level validation tests ─────────────────────────────────────────

_VALID_CONTRACT_ID = "C" + "A" * 55
_VALID_PAYLOAD = {
    "contract_id": _VALID_CONTRACT_ID,
    "name": "My Contract",
    "network": "testnet",
}


def _serialize(data, instance=None):
    return TrackedContractSerializer(instance=instance, data=data)


@pytest.mark.django_db
class TestTrackedContractSerializerValidation:

    # --- contract_id format ---

    def test_valid_contract_id_passes(self):
        s = _serialize(_VALID_PAYLOAD)
        assert s.is_valid(), s.errors

    def test_invalid_prefix_rejected_by_serializer(self):
        data = {**_VALID_PAYLOAD, "contract_id": "G" + "A" * 55}
        s = _serialize(data)
        assert not s.is_valid()
        assert "contract_id" in s.errors
        assert "Soroban contract address" in str(s.errors["contract_id"])

    def test_wrong_length_rejected_by_serializer(self):
        for bad_id in ["C" + "A" * 54, "C" + "A" * 56]:
            s = _serialize({**_VALID_PAYLOAD, "contract_id": bad_id})
            assert not s.is_valid()
            assert "contract_id" in s.errors

    def test_invalid_charset_rejected_by_serializer(self):
        bad_id = "C" + "0" * 55  # '0' is not in Base32 alphabet
        s = _serialize({**_VALID_PAYLOAD, "contract_id": bad_id})
        assert not s.is_valid()
        assert "contract_id" in s.errors

    def test_leading_whitespace_stripped_and_validated(self):
        # Padded with spaces makes length wrong → should fail
        bad_id = " " + "C" + "A" * 54  # 56 chars but leading space stripped → 55 chars
        s = _serialize({**_VALID_PAYLOAD, "contract_id": bad_id})
        assert not s.is_valid()
        assert "contract_id" in s.errors

    # --- duplicate check ---

    def test_duplicate_contract_id_rejected(self):
        TrackedContractFactory(contract_id=_VALID_CONTRACT_ID)
        s = _serialize(_VALID_PAYLOAD)
        assert not s.is_valid()
        assert "contract_id" in s.errors
        assert "already registered" in str(s.errors["contract_id"])

    def test_duplicate_check_skipped_on_update(self):
        """Re-submitting the same contract_id on an update (PUT/PATCH) must not fail."""
        existing = TrackedContractFactory(contract_id=_VALID_CONTRACT_ID)
        s = _serialize({**_VALID_PAYLOAD, "name": "Updated Name"}, instance=existing)
        assert s.is_valid(), s.errors

    # --- network validity ---

    def test_valid_networks_accepted(self):
        for net in ("mainnet", "testnet", "futurenet"):
            s = _serialize({**_VALID_PAYLOAD, "contract_id": "C" + "B" * 55, "network": net})
            assert s.is_valid(), f"Expected {net} to be valid, got: {s.errors}"

    def test_invalid_network_rejected(self):
        s = _serialize({**_VALID_PAYLOAD, "network": "devnet"})
        assert not s.is_valid()
        assert "network" in s.errors
        assert "valid network" in str(s.errors["network"]).lower()

    def test_empty_network_rejected(self):
        s = _serialize({**_VALID_PAYLOAD, "network": ""})
        assert not s.is_valid()
        assert "network" in s.errors

    # --- error message clarity ---

    def test_error_message_mentions_base32(self):
        bad = {**_VALID_PAYLOAD, "contract_id": "XABCDE" + "A" * 50}
        s = _serialize(bad)
        assert not s.is_valid()
        msg = str(s.errors["contract_id"])
        assert "Base32" in msg or "C" in msg

    def test_network_error_lists_valid_choices(self):
        s = _serialize({**_VALID_PAYLOAD, "network": "unknown"})
        assert not s.is_valid()
        msg = str(s.errors["network"])
        # At least one valid network name should appear in the error
        assert any(n in msg for n in ("mainnet", "testnet", "futurenet"))

    # --- network field is now included in output ---

    def test_network_field_present_in_serialized_output(self):
        contract = TrackedContractFactory(network="testnet")
        s = TrackedContractSerializer(instance=contract)
        assert "network" in s.data
        assert s.data["network"] == "testnet"
