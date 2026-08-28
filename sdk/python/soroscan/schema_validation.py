"""Pydantic schema validation models for SoroScan event topics and payload fields."""

import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class SchemaValidationError(Exception):
    """Raised when event data fails schema validation."""

    def __init__(self, field: str, reason: str, value: Any = None):
        """Initialize validation error with context."""
        self.field = field
        self.reason = reason
        self.value = value
        msg = f"Schema validation failed for '{field}': {reason}"
        if value is not None:
            msg += f" (got {value!r})"
        super().__init__(msg)


class EventTopicField(BaseModel):
    """Represents a single topic field in an event."""

    name: str = Field(..., description="Topic field name")
    type: Literal["Symbol", "Address", "Int128", "Bytes", "Bool"] = Field(
        ..., description="Event topic data type"
    )
    description: str = Field(default="", description="Field description")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate topic field name format."""
        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", v):
            raise ValueError("Field name must be a valid identifier (alphanumeric + underscore)")
        if len(v) > 100:
            raise ValueError("Field name cannot exceed 100 characters")
        return v


class EventPayloadField(BaseModel):
    """Represents a single field in an event payload schema."""

    name: str = Field(..., description="Payload field name")
    type: str = Field(..., description="Field data type")
    required: bool = Field(default=True, description="Whether field is required")
    description: str = Field(default="", description="Field description")
    max_length: int | None = Field(None, description="Max length for string fields")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate payload field name format."""
        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", v):
            raise ValueError("Field name must be a valid identifier (alphanumeric + underscore)")
        if len(v) > 100:
            raise ValueError("Field name cannot exceed 100 characters")
        return v


class EventRecordSchema(BaseModel):
    """Schema definition for a standardized event record."""

    event_type: str = Field(..., min_length=1, max_length=100, description="Event type identifier")
    contract_id: str = Field(
        ..., min_length=55, max_length=56, description="Stellar contract address (C...)"
    )
    topics: list[EventTopicField] = Field(default_factory=list, description="Event topic fields")
    payload_schema: list[EventPayloadField] = Field(
        default_factory=list, description="Event payload schema"
    )
    ledger_min: int = Field(default=0, ge=0, description="Minimum ledger sequence")
    ledger_max: int | None = Field(None, ge=0, description="Maximum ledger sequence")
    description: str = Field(default="", description="Event description")

    @field_validator("contract_id")
    @classmethod
    def validate_contract_id(cls, v: str) -> str:
        """Validate Stellar contract address format (C...)."""
        if not v.startswith("C"):
            raise ValueError("Contract ID must start with 'C' (Stellar contract address)")
        if not re.match(r"^C[A-Z2-7]{54,55}$", v):
            raise ValueError("Invalid Stellar contract address format")
        return v

    @model_validator(mode="after")
    def validate_ledger_bounds(self) -> "EventRecordSchema":
        """Validate ledger bounds logic."""
        if self.ledger_max is not None and self.ledger_min > self.ledger_max:
            raise SchemaValidationError(
                "ledger_bounds",
                f"ledger_min ({self.ledger_min}) cannot exceed ledger_max ({self.ledger_max})",
            )
        return self


class EventRecordValidator(BaseModel):
    """Validator for event records against their schema."""

    event_type: str = Field(..., description="Event type being validated")
    contract_id: str = Field(..., description="Contract address")
    topics: list[dict[str, Any]] = Field(..., description="Event topic values")
    payload: dict[str, Any] = Field(..., description="Event payload data")
    ledger: int = Field(..., ge=0, description="Ledger sequence number")
    timestamp: int = Field(..., ge=0, description="Unix timestamp")
    payload_hash: str = Field(..., pattern=r"^[a-f0-9]{64}$", description="SHA-256 hash (hex)")

    @field_validator("contract_id")
    @classmethod
    def validate_contract_id(cls, v: str) -> str:
        """Validate Stellar contract address format."""
        if not v.startswith("C"):
            raise SchemaValidationError(
                "contract_id", "Contract ID must start with 'C'", value=v
            )
        if not re.match(r"^C[A-Z2-7]{54,55}$", v):
            raise SchemaValidationError(
                "contract_id", "Invalid Stellar contract address format", value=v
            )
        return v

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        """Validate event type format."""
        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", v):
            raise SchemaValidationError(
                "event_type", "Event type must be a valid identifier", value=v
            )
        if len(v) > 100:
            raise SchemaValidationError(
                "event_type", "Event type cannot exceed 100 characters", value=v
            )
        return v

    def validate_against_schema(self, schema: EventRecordSchema) -> None:
        """Validate this event record against a schema definition.

        Args:
            schema: EventRecordSchema to validate against

        Raises:
            SchemaValidationError: If validation fails
        """
        # Validate event type matches
        if self.event_type != schema.event_type:
            raise SchemaValidationError(
                "event_type",
                f"Event type mismatch: expected '{schema.event_type}'",
                value=self.event_type,
            )

        # Validate contract ID matches
        if self.contract_id != schema.contract_id:
            raise SchemaValidationError(
                "contract_id",
                f"Contract ID mismatch: expected '{schema.contract_id}'",
                value=self.contract_id,
            )

        # Validate ledger bounds
        if self.ledger < schema.ledger_min:
            raise SchemaValidationError(
                "ledger",
                f"Ledger {self.ledger} is below minimum {schema.ledger_min}",
                value=self.ledger,
            )
        if schema.ledger_max is not None and self.ledger > schema.ledger_max:
            raise SchemaValidationError(
                "ledger",
                f"Ledger {self.ledger} exceeds maximum {schema.ledger_max}",
                value=self.ledger,
            )

        # Validate topics
        if len(self.topics) != len(schema.topics):
            raise SchemaValidationError(
                "topics",
                f"Topic count mismatch: expected {len(schema.topics)}, got {len(self.topics)}",
                value=len(self.topics),
            )

        for i, (topic_value, topic_schema) in enumerate(zip(self.topics, schema.topics)):
            if not isinstance(topic_value, dict) or topic_schema.name not in topic_value:
                raise SchemaValidationError(
                    f"topics[{i}]",
                    f"Missing required topic field '{topic_schema.name}'",
                    value=topic_value,
                )

        # Validate payload fields
        for field_schema in schema.payload_schema:
            if field_schema.required and field_schema.name not in self.payload:
                raise SchemaValidationError(
                    "payload",
                    f"Missing required payload field '{field_schema.name}'",
                )

            if field_schema.name in self.payload:
                payload_value = self.payload[field_schema.name]

                # Validate string max_length
                if (
                    field_schema.max_length is not None
                    and isinstance(payload_value, str)
                    and len(payload_value) > field_schema.max_length
                ):
                    raise SchemaValidationError(
                        f"payload.{field_schema.name}",
                        f"String exceeds max length of {field_schema.max_length}",
                        value=payload_value,
                    )
