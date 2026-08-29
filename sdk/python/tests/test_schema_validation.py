"""Test suite for schema validation models."""

import pytest
from pydantic import ValidationError

from soroscan.schema_validation import (
    EventPayloadField,
    EventRecordSchema,
    EventRecordValidator,
    EventTopicField,
    SchemaValidationError,
)


class TestEventTopicField:
    """Tests for EventTopicField validation."""

    def test_valid_topic_field(self):
        """Test creating a valid topic field."""
        field = EventTopicField(
            name="transfer_type",
            type="Symbol",
            description="Type of transfer",
        )
        assert field.name == "transfer_type"
        assert field.type == "Symbol"

    def test_invalid_field_name_format(self):
        """Test that invalid field names are rejected."""
        with pytest.raises(ValidationError) as exc_info:
            EventTopicField(name="123invalid", type="Symbol")
        assert "identifier" in str(exc_info.value).lower()

    def test_field_name_exceeds_max_length(self):
        """Test that field names exceeding 100 chars are rejected."""
        long_name = "a" * 101
        with pytest.raises(ValidationError):
            EventTopicField(name=long_name, type="Symbol")

    def test_valid_types(self):
        """Test all valid topic field types."""
        valid_types = ["Symbol", "Address", "Int128", "Bytes", "Bool"]
        for type_name in valid_types:
            field = EventTopicField(name="test", type=type_name)
            assert field.type == type_name


class TestEventPayloadField:
    """Tests for EventPayloadField validation."""

    def test_valid_payload_field(self):
        """Test creating a valid payload field."""
        field = EventPayloadField(
            name="amount",
            type="Int128",
            required=True,
            max_length=None,
        )
        assert field.name == "amount"
        assert field.required is True

    def test_optional_payload_field(self):
        """Test creating an optional payload field."""
        field = EventPayloadField(
            name="memo",
            type="Bytes",
            required=False,
        )
        assert field.required is False

    def test_string_field_with_max_length(self):
        """Test payload field with max_length constraint."""
        field = EventPayloadField(
            name="description",
            type="string",
            max_length=256,
        )
        assert field.max_length == 256

    def test_invalid_field_name(self):
        """Test that invalid field names are rejected."""
        with pytest.raises(ValidationError):
            EventPayloadField(name="-invalid", type="string")


class TestEventRecordSchema:
    """Tests for EventRecordSchema validation."""

    def test_valid_schema_creation(self):
        """Test creating a valid event record schema."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[
                EventTopicField(name="from", type="Address"),
                EventTopicField(name="to", type="Address"),
            ],
            payload_schema=[
                EventPayloadField(name="amount", type="Int128", required=True),
            ],
            ledger_min=1000,
            ledger_max=2000,
        )
        assert schema.event_type == "transfer"
        assert len(schema.topics) == 2
        assert len(schema.payload_schema) == 1

    def test_invalid_contract_id_no_c_prefix(self):
        """Test that contract IDs not starting with 'C' are rejected."""
        with pytest.raises(ValidationError) as exc_info:
            EventRecordSchema(
                event_type="transfer",
                contract_id="GBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            )
        assert "start with 'C'" in str(exc_info.value)

    def test_invalid_contract_id_format(self):
        """Test that malformed contract IDs are rejected."""
        with pytest.raises(ValidationError):
            EventRecordSchema(
                event_type="transfer",
                contract_id="CNOTAVALIDCONTRACTADDRESSFORMAT",
            )

    def test_contract_id_length_validation(self):
        """Test that contract IDs must be exactly 56 characters."""
        with pytest.raises(ValidationError):
            EventRecordSchema(
                event_type="transfer",
                contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B",  # Too short
            )

    def test_ledger_bounds_validation_max_less_than_min(self):
        """Test that ledger_max < ledger_min raises error."""
        with pytest.raises(SchemaValidationError) as exc_info:
            EventRecordSchema(
                event_type="transfer",
                contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
                ledger_min=2000,
                ledger_max=1000,
            )
        assert "ledger_min" in str(exc_info.value)
        assert "ledger_max" in str(exc_info.value)

    def test_event_type_length_validation(self):
        """Test event type length constraints."""
        with pytest.raises(ValidationError):
            EventRecordSchema(
                event_type="",  # Too short (min_length=1)
                contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            )

    def test_event_type_max_length(self):
        """Test event type cannot exceed 100 characters."""
        with pytest.raises(ValidationError):
            EventRecordSchema(
                event_type="a" * 101,
                contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            )


class TestEventRecordValidator:
    """Tests for EventRecordValidator and schema validation."""

    def test_valid_event_record(self):
        """Test creating a valid event record."""
        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[{"from": "from_address"}, {"to": "to_address"}],
            payload={"amount": 1000},
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )
        assert record.event_type == "transfer"
        assert record.ledger == 1500

    def test_invalid_contract_id_in_validator(self):
        """Test that invalid contract IDs are rejected in validator."""
        with pytest.raises(SchemaValidationError) as exc_info:
            EventRecordValidator(
                event_type="transfer",
                contract_id="GBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
                topics=[],
                payload={},
                ledger=1500,
                timestamp=1609459200,
                payload_hash="a" * 64,
            )
        assert "start with 'C'" in str(exc_info.value)

    def test_invalid_payload_hash_not_hex(self):
        """Test that non-hex payload hash is rejected."""
        with pytest.raises(ValidationError):
            EventRecordValidator(
                event_type="transfer",
                contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
                topics=[],
                payload={},
                ledger=1500,
                timestamp=1609459200,
                payload_hash="not_hex" + "a" * 57,
            )

    def test_invalid_payload_hash_wrong_length(self):
        """Test that payload hash must be exactly 64 hex characters."""
        with pytest.raises(ValidationError):
            EventRecordValidator(
                event_type="transfer",
                contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
                topics=[],
                payload={},
                ledger=1500,
                timestamp=1609459200,
                payload_hash="a" * 63,  # Too short
            )

    def test_validate_against_schema_success(self):
        """Test successful validation against schema."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[EventTopicField(name="from", type="Address")],
            payload_schema=[EventPayloadField(name="amount", type="Int128", required=True)],
            ledger_min=1000,
            ledger_max=2000,
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[{"from": "from_address"}],
            payload={"amount": 1000},
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        # Should not raise
        record.validate_against_schema(schema)

    def test_validate_event_type_mismatch(self):
        """Test schema validation fails on event type mismatch."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
        )

        record = EventRecordValidator(
            event_type="swap",  # Mismatch
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[],
            payload={},
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "Event type mismatch" in str(exc_info.value)

    def test_validate_contract_id_mismatch(self):
        """Test schema validation fails on contract ID mismatch."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CDQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLU",  # Different first char
            topics=[],
            payload={},
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "Contract ID mismatch" in str(exc_info.value)

    def test_validate_ledger_below_minimum(self):
        """Test schema validation fails when ledger is below minimum."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            ledger_min=2000,
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[],
            payload={},
            ledger=1500,  # Below minimum
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "below minimum" in str(exc_info.value)

    def test_validate_ledger_exceeds_maximum(self):
        """Test schema validation fails when ledger exceeds maximum."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            ledger_max=2000,
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[],
            payload={},
            ledger=2500,  # Exceeds maximum
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "exceeds maximum" in str(exc_info.value)

    def test_validate_missing_required_payload_field(self):
        """Test schema validation fails when required payload field is missing."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            payload_schema=[
                EventPayloadField(name="amount", type="Int128", required=True),
            ],
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[],
            payload={},  # Missing 'amount'
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "amount" in str(exc_info.value)

    def test_validate_payload_string_exceeds_max_length(self):
        """Test schema validation fails when payload string exceeds max length."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            payload_schema=[
                EventPayloadField(
                    name="memo",
                    type="string",
                    required=True,
                    max_length=10,
                ),
            ],
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[],
            payload={"memo": "this_is_too_long"},
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "max length" in str(exc_info.value)

    def test_validate_topic_count_mismatch(self):
        """Test schema validation fails on topic count mismatch."""
        schema = EventRecordSchema(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[
                EventTopicField(name="from", type="Address"),
                EventTopicField(name="to", type="Address"),
            ],
        )

        record = EventRecordValidator(
            event_type="transfer",
            contract_id="CBQHJITMBPL5YKQQPVCNPCFN3PXMQGXZ2B52FKRLLFMX5TWYFL2YFLV",
            topics=[{"from": "address1"}],  # Only 1 topic, expected 2
            payload={},
            ledger=1500,
            timestamp=1609459200,
            payload_hash="a" * 64,
        )

        with pytest.raises(SchemaValidationError) as exc_info:
            record.validate_against_schema(schema)
        assert "Topic count mismatch" in str(exc_info.value)
