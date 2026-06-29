"""
Management command: import_contracts

Imports TrackedContract records from a JSON file containing address/name mappings.

Usage:
    python manage.py import_contracts --input contracts.json
    python manage.py import_contracts --file contracts.json --owner admin
"""
import json

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from soroscan.ingest.models import TrackedContract


DEFAULT_IMPORT_USERNAME = "soroscan-import"


class Command(BaseCommand):
    help = "Import tracked contracts from a JSON address/name mapping file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            "--input",
            dest="file",
            required=True,
            help="Input JSON file path",
        )
        parser.add_argument(
            "--owner",
            default=None,
            help=(
                "Username, email, or id of the owner for newly imported contracts. "
                f"Defaults to a service user named {DEFAULT_IMPORT_USERNAME}."
            ),
        )

    def handle(self, *args, **options):
        path = options["file"]

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON in {path}: {exc}") from exc
        except OSError as exc:
            raise CommandError(f"Unable to read {path}: {exc}") from exc

        owner = self._resolve_owner(options["owner"])
        contracts = self._extract_contracts(data)

        created = 0
        skipped = 0

        for contract in contracts:
            _, was_created = TrackedContract.objects.get_or_create(
                contract_id=contract["contract_id"],
                defaults={
                    "name": contract["name"],
                    "owner": owner,
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported contracts: created={created} skipped_existing={skipped}"
            )
        )

    def _resolve_owner(self, owner_lookup):
        User = get_user_model()

        if not owner_lookup:
            owner, _ = User.objects.get_or_create(
                username=DEFAULT_IMPORT_USERNAME,
                defaults={"email": "soroscan-import@example.com"},
            )
            return owner

        filters = [{"username": owner_lookup}, {"email": owner_lookup}]
        if str(owner_lookup).isdigit():
            filters.insert(0, {"id": int(owner_lookup)})

        for lookup in filters:
            try:
                return User.objects.get(**lookup)
            except User.DoesNotExist:
                continue
            except User.MultipleObjectsReturned as exc:
                raise CommandError(
                    f"Multiple users matched owner {owner_lookup!r}"
                ) from exc

        raise CommandError(f"Owner user not found: {owner_lookup}")

    def _extract_contracts(self, data):
        if isinstance(data, dict) and "contracts" in data:
            raw_contracts = data["contracts"]
        elif isinstance(data, dict):
            raw_contracts = self._mapping_to_contracts(data)
        elif isinstance(data, list):
            raw_contracts = data
        else:
            raise CommandError(
                "Invalid import format: expected a JSON object or list of contracts."
            )

        if isinstance(raw_contracts, dict):
            raw_contracts = self._mapping_to_contracts(raw_contracts)

        if not isinstance(raw_contracts, list):
            raise CommandError("Invalid import format: contracts must be a list.")

        contracts = []
        for index, item in enumerate(raw_contracts, start=1):
            try:
                contract = self._normalize_contract(item)
            except (TypeError, ValueError, ValidationError) as exc:
                raise CommandError(f"Invalid contract at row {index}: {exc}") from exc
            contracts.append(contract)

        return contracts

    @staticmethod
    def _mapping_to_contracts(mapping):
        return [
            {"contract_id": contract_id, "name": name}
            for contract_id, name in mapping.items()
        ]

    def _normalize_contract(self, item):
        if not isinstance(item, dict):
            raise TypeError("expected an object with contract_id and name")

        contract_id = str(item.get("contract_id") or item.get("address") or "").strip()
        name = str(item.get("name") or "").strip()

        if not contract_id:
            raise ValueError("missing contract_id")
        if not name:
            raise ValueError("missing name")

        validator = TrackedContract(contract_id=contract_id, name=name)
        validator.full_clean(exclude=["owner"], validate_unique=False)

        return {"contract_id": contract_id, "name": name}
