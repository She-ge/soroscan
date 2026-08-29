"""
Pre-defined JSON schemas for standard Soroban contract event types.

Each schema validates the expected payload structure for a given contract
standard (SC-20, SC-21, SC-31, SC-36, SC-38). Contracts register their
EventSchema pointing to one of these definitions.
"""
from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# SC-20: Token contract events (transfer, mint, burn, clawback)
# ---------------------------------------------------------------------------

SC20_TRANSFER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Source address (G... or C...)"},
        "to": {"type": "string", "description": "Destination address"},
        "amount": {"type": "string", "description": "Token amount as string (i128)"},
    },
    "required": ["from", "to", "amount"],
    "additionalProperties": False,
}

SC20_MINT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "to": {"type": "string", "description": "Mint destination address"},
        "amount": {"type": "string", "description": "Token amount as string (i128)"},
    },
    "required": ["to", "amount"],
    "additionalProperties": False,
}

SC20_BURN_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Burn source address"},
        "amount": {"type": "string", "description": "Token amount as string (i128)"},
    },
    "required": ["from", "amount"],
    "additionalProperties": False,
}

SC20_CLAWBACK_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Clawback source address"},
        "amount": {"type": "string", "description": "Token amount as string (i128)"},
    },
    "required": ["from", "amount"],
    "additionalProperties": False,
}

# ---------------------------------------------------------------------------
# SC-21: NFT contract events (transfer, mint, burn)
# ---------------------------------------------------------------------------

SC21_TRANSFER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Source address"},
        "to": {"type": "string", "description": "Destination address"},
        "token_id": {"type": "string", "description": "NFT token identifier"},
    },
    "required": ["from", "to", "token_id"],
    "additionalProperties": False,
}

SC21_MINT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "to": {"type": "string", "description": "Mint destination address"},
        "token_id": {"type": "string", "description": "NFT token identifier"},
    },
    "required": ["to", "token_id"],
    "additionalProperties": False,
}

SC21_BURN_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Burn source address"},
        "token_id": {"type": "string", "description": "NFT token identifier"},
    },
    "required": ["from", "token_id"],
    "additionalProperties": False,
}

# ---------------------------------------------------------------------------
# SC-31: AMM contract events (swap, add_liquidity, remove_liquidity)
# ---------------------------------------------------------------------------

SC31_SWAP_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Trader address"},
        "token_in": {"type": "string", "description": "Input token contract"},
        "token_out": {"type": "string", "description": "Output token contract"},
        "amount_in": {"type": "string", "description": "Input amount"},
        "amount_out": {"type": "string", "description": "Output amount"},
    },
    "required": ["from", "token_in", "token_out", "amount_in", "amount_out"],
    "additionalProperties": False,
}

SC31_ADD_LIQUIDITY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Provider address"},
        "token_a": {"type": "string"},
        "token_b": {"type": "string"},
        "amount_a": {"type": "string"},
        "amount_b": {"type": "string"},
        "lp_tokens": {"type": "string", "description": "LP tokens minted"},
    },
    "required": ["from", "token_a", "token_b", "amount_a", "amount_b", "lp_tokens"],
    "additionalProperties": False,
}

SC31_REMOVE_LIQUIDITY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "from": {"type": "string", "description": "Provider address"},
        "token_a": {"type": "string"},
        "token_b": {"type": "string"},
        "amount_a": {"type": "string"},
        "amount_b": {"type": "string"},
        "lp_tokens": {"type": "string", "description": "LP tokens burned"},
    },
    "required": ["from", "token_a", "token_b", "amount_a", "amount_b", "lp_tokens"],
    "additionalProperties": False,
}

# ---------------------------------------------------------------------------
# SC-36: Faucet contract events (mint_test_tokens)
# ---------------------------------------------------------------------------

SC36_MINT_TEST_TOKENS_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "to": {"type": "string", "description": "Recipient address"},
        "amount": {"type": "string", "description": "Amount minted"},
        "token": {"type": "string", "description": "Token contract"},
    },
    "required": ["to", "amount", "token"],
    "additionalProperties": False,
}

# ---------------------------------------------------------------------------
# SC-38: SoroScan indexer contract events (record_event)
# ---------------------------------------------------------------------------

SC38_RECORD_EVENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "indexer": {"type": "string", "description": "Indexer address"},
        "contract_id": {"type": "string", "description": "Target contract"},
        "event_type": {"type": "string", "description": "Event type name"},
        "payload": {"type": "object", "description": "Event payload data"},
        "schema_version": {"type": "integer", "minimum": 1},
    },
    "required": ["indexer", "contract_id", "event_type", "payload", "schema_version"],
    "additionalProperties": False,
}

# ---------------------------------------------------------------------------
# Registry: maps (standard, event_type) -> schema
# ---------------------------------------------------------------------------

CONTRACT_EVENT_SCHEMAS: dict[tuple[str, str], dict[str, Any]] = {
    ("sc_20", "transfer"): SC20_TRANSFER_SCHEMA,
    ("sc_20", "mint"): SC20_MINT_SCHEMA,
    ("sc_20", "burn"): SC20_BURN_SCHEMA,
    ("sc_20", "clawback"): SC20_CLAWBACK_SCHEMA,
    ("sc_21", "transfer"): SC21_TRANSFER_SCHEMA,
    ("sc_21", "mint"): SC21_MINT_SCHEMA,
    ("sc_21", "burn"): SC21_BURN_SCHEMA,
    ("sc_31", "swap"): SC31_SWAP_SCHEMA,
    ("sc_31", "add_liquidity"): SC31_ADD_LIQUIDITY_SCHEMA,
    ("sc_31", "remove_liquidity"): SC31_REMOVE_LIQUIDITY_SCHEMA,
    ("sc_36", "mint_test_tokens"): SC36_MINT_TEST_TOKENS_SCHEMA,
    ("sc_38", "record_event"): SC38_RECORD_EVENT_SCHEMA,
}


def get_schema_for_event(standard: str, event_type: str) -> dict[str, Any] | None:
    """Return the JSON schema for a given contract standard and event type."""
    return CONTRACT_EVENT_SCHEMAS.get((standard, event_type))


def validate_against_standard_schema(
    payload: dict[str, Any],
    standard: str,
    event_type: str,
) -> tuple[bool, str | None]:
    """
    Validate a payload against the pre-defined schema for a contract standard.

    Returns (is_valid, error_message).
    """
    import jsonschema

    schema = get_schema_for_event(standard, event_type)
    if schema is None:
        return True, None

    try:
        jsonschema.validate(instance=payload, schema=schema)
        return True, None
    except jsonschema.ValidationError as exc:
        return False, exc.message
