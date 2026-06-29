import json

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError

from soroscan.ingest.management.commands.import_contracts import (
    DEFAULT_IMPORT_USERNAME,
)
from soroscan.ingest.models import TrackedContract
from soroscan.ingest.tests.factories import TrackedContractFactory, UserFactory


def contract_id(n: int) -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    encoded = "".join(alphabet[n >> (5 * i) & 0x1F] for i in range(54, -1, -1))
    return f"C{encoded}"


@pytest.mark.django_db
class TestImportContractsCommand:
    def test_imports_contracts_from_export_format(self, tmp_path):
        path = tmp_path / "contracts.json"
        path.write_text(
            json.dumps(
                {
                    "contracts": [
                        {"contract_id": contract_id(1), "name": "Token"},
                        {"contract_id": contract_id(2), "name": "Marketplace"},
                    ]
                }
            ),
            encoding="utf-8",
        )

        call_command("import_contracts", "--input", str(path))

        assert TrackedContract.objects.count() == 2
        assert TrackedContract.objects.get(contract_id=contract_id(1)).name == "Token"
        assert (
            TrackedContract.objects.get(contract_id=contract_id(2)).name
            == "Marketplace"
        )
        assert get_user_model().objects.filter(username=DEFAULT_IMPORT_USERNAME).exists()

    def test_skips_existing_contracts_without_updating(self, tmp_path):
        existing = TrackedContractFactory(contract_id=contract_id(3), name="Original")
        path = tmp_path / "contracts.json"
        path.write_text(
            json.dumps(
                {
                    "contracts": [
                        {"contract_id": existing.contract_id, "name": "Changed"},
                        {"contract_id": contract_id(4), "name": "New Contract"},
                    ]
                }
            ),
            encoding="utf-8",
        )

        call_command("import_contracts", file=str(path))

        existing.refresh_from_db()
        assert existing.name == "Original"
        assert TrackedContract.objects.count() == 2
        assert TrackedContract.objects.filter(contract_id=contract_id(4)).exists()

    def test_uses_explicit_owner_for_new_contracts(self, tmp_path):
        owner = UserFactory(username="admin")
        path = tmp_path / "contracts.json"
        path.write_text(
            json.dumps(
                {"contracts": [{"contract_id": contract_id(5), "name": "Owned"}]}
            ),
            encoding="utf-8",
        )

        call_command("import_contracts", file=str(path), owner=owner.username)

        assert TrackedContract.objects.get(contract_id=contract_id(5)).owner == owner

    def test_imports_plain_address_name_mapping(self, tmp_path):
        path = tmp_path / "contracts.json"
        path.write_text(
            json.dumps({contract_id(6): "Plain Mapping"}),
            encoding="utf-8",
        )

        call_command("import_contracts", file=str(path))

        assert (
            TrackedContract.objects.get(contract_id=contract_id(6)).name
            == "Plain Mapping"
        )

    def test_imports_nested_address_name_mapping(self, tmp_path):
        path = tmp_path / "contracts.json"
        path.write_text(
            json.dumps({"contracts": {contract_id(7): "Nested Mapping"}}),
            encoding="utf-8",
        )

        call_command("import_contracts", file=str(path))

        assert (
            TrackedContract.objects.get(contract_id=contract_id(7)).name
            == "Nested Mapping"
        )

    def test_invalid_contract_raises_command_error(self, tmp_path):
        path = tmp_path / "contracts.json"
        path.write_text(
            json.dumps({"contracts": [{"contract_id": "not-valid", "name": "Bad"}]}),
            encoding="utf-8",
        )

        with pytest.raises(CommandError, match="Invalid contract at row 1"):
            call_command("import_contracts", file=str(path))
