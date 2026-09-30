"""
Model-level unit tests.

Covers ``ContractVerification`` state transitions (#1499).
"""
from __future__ import annotations

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from soroscan.ingest.models import ContractSource, ContractVerification

from .factories import TrackedContractFactory, UserFactory


def _make_verification(*, bytecode_hash: str = "a" * 64) -> ContractVerification:
    """Build a persisted ContractVerification with its dependency graph."""
    user = UserFactory()
    contract = TrackedContractFactory(owner=user)
    source = ContractSource.objects.create(
        contract=contract,
        source_file=SimpleUploadedFile("contract.rs", b"fn main() {}"),
        uploaded_by=user,
    )
    return ContractVerification.objects.create(
        contract=contract,
        source=source,
        bytecode_hash=bytecode_hash,
    )


@pytest.mark.django_db
class TestContractVerificationTransitions:
    def test_new_verification_defaults_to_pending(self):
        v = _make_verification()
        assert v.status == ContractVerification.Status.PENDING
        assert v.verified_at is None
        assert v.error_message == ""

    def test_mark_verified_sets_status_hash_and_timestamp(self):
        v = _make_verification(bytecode_hash="0" * 64)
        before = timezone.now()
        v.mark_verified("f" * 64)
        after = timezone.now()

        v.refresh_from_db()
        assert v.status == ContractVerification.Status.VERIFIED
        assert v.bytecode_hash == "f" * 64
        assert v.verified_at is not None
        assert before <= v.verified_at <= after
        assert v.error_message == ""

    def test_mark_verified_clears_previous_error_message(self):
        v = _make_verification()
        v.mark_failed("earlier failure")
        v.refresh_from_db()
        assert v.error_message == "earlier failure"

        v.mark_verified("a" * 64)
        v.refresh_from_db()
        assert v.error_message == ""
        assert v.status == ContractVerification.Status.VERIFIED

    def test_mark_verified_does_not_touch_compiler_version(self):
        v = _make_verification()
        v.compiler_version = "soroban 21.0.0"
        v.save(update_fields=["compiler_version"])

        v.mark_verified("2" * 64)
        v.refresh_from_db()
        assert v.compiler_version == "soroban 21.0.0"

    def test_mark_failed_sets_status_and_reason(self):
        v = _make_verification()
        v.mark_failed("bytecode mismatch at offset 0x40")

        v.refresh_from_db()
        assert v.status == ContractVerification.Status.FAILED
        assert v.error_message == "bytecode mismatch at offset 0x40"

    def test_mark_failed_leaves_verified_at_none(self):
        v = _make_verification()
        assert v.verified_at is None

        v.mark_failed("some reason")
        v.refresh_from_db()
        assert v.verified_at is None

    def test_mark_failed_preserves_existing_bytecode_hash(self):
        original = "1" * 64
        v = _make_verification(bytecode_hash=original)

        v.mark_failed("reason")
        v.refresh_from_db()
        assert v.bytecode_hash == original

    def test_failed_then_verified_round_trip(self):
        v = _make_verification()
        v.mark_failed("transient")
        v.refresh_from_db()
        assert v.status == ContractVerification.Status.FAILED

        v.mark_verified("c" * 64)
        v.refresh_from_db()
        assert v.status == ContractVerification.Status.VERIFIED
        assert v.bytecode_hash == "c" * 64
        assert v.error_message == ""
        assert v.verified_at is not None