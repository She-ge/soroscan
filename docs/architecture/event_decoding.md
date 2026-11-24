# Event Decoding

SoroScan decodes raw Soroban XDR event payloads into structured, human-readable JSON using per-contract ABI definitions.
Decoding is best-effort — a failure never blocks event persistence, and the raw XDR is always preserved for debugging.

---

## Overview

When a Soroban contract emits an event, the payload arrives as a base64-encoded XDR `SCVal`. Without a schema, this is
opaque to consumers. SoroScan resolves this by letting contract owners upload an ABI — a JSON array of event definitions
that maps positional XDR fields to named, typed values.

The pipeline for each event is:

```
Raw XDR (SCVal)
      │
      ▼
  Parse XDR  ──────────────────────── No ABI registered? → decoding_status = "no_abi"
      │
      ▼
  Match event_type in ABI  ─────────── No matching def? → decoding_status = "no_abi"
      │
      ▼
  Map SCV_VEC items → named fields
      │
      ▼
  decoded_payload (JSON)  ──────────── Exception? → decoding_status = "failed"
      │
      ▼
  decoding_status = "success"
```

The result is stored on `ContractEvent.decoded_payload` (JSONField) and `ContractEvent.decoding_status`.

---

## ABI Format

A contract ABI is a JSON array of event definitions. Each definition names an event type and lists its fields in the
order they appear in the XDR `SCVec`.

```json
[
  {
    "name": "transfer",
    "fields": [
      { "name": "from", "type": "Address" },
      { "name": "to", "type": "Address" },
      { "name": "amount", "type": "I128" }
    ]
  },
  {
    "name": "mint",
    "fields": [
      { "name": "to", "type": "Address" },
      { "name": "amount", "type": "I128" }
    ]
  }
]
```

### Supported field types

| Type      | XDR representation | Python output                    |
| --------- | ------------------ | -------------------------------- |
| `Address` | `SCV_ADDRESS`      | Strkey string (`G...` or `C...`) |
| `I128`    | `SCV_I128`         | Python `int`                     |
| `U128`    | `SCV_U128`         | Python `int`                     |
| `I64`     | `SCV_I64`          | Python `int`                     |
| `U64`     | `SCV_U64`          | Python `int`                     |
| `I32`     | `SCV_I32`          | Python `int`                     |
| `U32`     | `SCV_U32`          | Python `int`                     |
| `String`  | `SCV_STRING`       | Python `str`                     |
| `Bool`    | `SCV_BOOL`         | Python `bool`                    |
| `Bytes`   | `SCV_BYTES`        | Hex-encoded `str`                |
| `Symbol`  | `SCV_SYMBOL`       | Python `str`                     |
| `Map`     | `SCV_MAP`          | Python `dict`                    |
| `Vec`     | `SCV_VEC`          | Python `list`                    |

Any type not in this list falls back to `scval.to_native()`, and if that also fails, `str(sc_val_obj)`.

### ABI meta-schema validation

When an ABI is uploaded, it is validated against `ABI_META_SCHEMA` before being stored in `ContractABI.abi_json`. An
invalid ABI raises a `jsonschema.ValidationError` and is rejected. The constraints are:

- Top-level value must be a JSON array.
- Each element must have `"name"` (non-empty string) and `"fields"` (array).
- Each field must have `"name"` (non-empty string) and `"type"` (one of the 13 supported type strings).
- No additional properties are allowed on event or field objects.

---

## XDR Decoding Internals

The core decoder lives in `soroscan/ingest/decoder.py`.

### `decode_event_payload(raw_xdr, abi_json, event_type)`

```python
from soroscan.ingest.decoder import decode_event_payload

result = decode_event_payload(
    raw_xdr="AAAAAQAAAAAAAAAAAAAAAAAAAP////8=",  # base64 XDR
    abi_json=[
        {
            "name": "transfer",
            "fields": [
                {"name": "from",   "type": "Address"},
                {"name": "to",     "type": "Address"},
                {"name": "amount", "type": "I128"},
            ],
        }
    ],
    event_type="transfer",
)
# {"from": "GABC...", "to": "GXYZ...", "amount": 1000000000}
```

Returns `None` when:

- No ABI definition matches `event_type`.
- The XDR string cannot be parsed by `stellar_xdr.SCVal.from_xdr()`.

Never raises — all exceptions are caught and logged, so event persistence is never blocked.

### Positional field mapping

Soroban encodes event data as `SCV_VEC` (an ordered vector of `SCVal` items). The decoder maps each vector item to the
corresponding field definition by index:

```
vec_items[0]  →  fields[0]  ("from",   "Address")
vec_items[1]  →  fields[1]  ("to",     "Address")
vec_items[2]  →  fields[2]  ("amount", "I128")
```

If the ABI defines more fields than the XDR vector contains, the extra fields are set to `null`. If the XDR is not a
`SCV_VEC` and only one field is defined, the whole value is decoded as that single field.

### Type coercion and fallback chain

Each `SCVal` is decoded via `_decode_sc_val(sc_val_obj, type_hint)`:

1. Try the type-specific `stellar_sdk.scval.to_<type>()` function.
1. On failure, fall back to `scval.to_native()` (generic Python conversion).
1. On that failure too, fall back to `str(sc_val_obj)`.

This means decoding always produces a value — it may be a string representation in the worst case, but it won't be
missing.

---

## Decoding Status

Every `ContractEvent` has a `decoding_status` field that reflects the outcome of ABI decoding.

| Status    | Meaning                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no_abi`  | No `ContractABI` is registered for this contract, or the ABI has no definition for this event type. This is the default for all events until an ABI is uploaded. |
| `success` | XDR was parsed and all fields were mapped. `decoded_payload` is populated.                                                                                       |
| `failed`  | An error occurred during XDR parsing (e.g. malformed base64, unexpected structure). `decoded_payload` is `null`.                                                 |

`decoding_status` is indexed on the database so you can efficiently filter for events that need attention:

```python
from soroscan.ingest.models import ContractEvent

# Events that failed to decode — may indicate an ABI mismatch
ContractEvent.objects.filter(
    contract__contract_id="C...",
    decoding_status="failed",
)

# Events awaiting an ABI upload
ContractEvent.objects.filter(
    contract__contract_id="C...",
    decoding_status="no_abi",
)
```

---

## Schema Validation Status

Separate from ABI decoding, SoroScan also validates event payloads against a versioned JSON Schema stored in
`EventSchema`. This produces a `validation_status` on each event.

| Status       | Meaning                                                                             |
| ------------ | ----------------------------------------------------------------------------------- |
| `passed`     | Payload validated successfully against the contract's `json_schema`.                |
| `failed`     | Payload did not conform to the JSON Schema (field missing, wrong type, etc.).       |
| `unverified` | No `json_schema` is configured on the `TrackedContract`, so validation was skipped. |

Schema validation runs via `validate_event_payload()` at ingest time and again during reprocessing. The `json_schema`
field on `TrackedContract` accepts any valid [JSON Schema](https://json-schema.org/) draft. A `null` or empty schema
skips validation entirely (result: `unverified`).

```python
# Contracts with recent schema failures
ContractEvent.objects.filter(
    contract__contract_id="C...",
    validation_status="failed",
).order_by("-timestamp")[:20]
```

---

## Signature Verification Status

If a `ContractSigningKey` is registered for the contract, SoroScan verifies each event's cryptographic signature and
records the result in `signature_status`.

| Status    | Meaning                                                          |
| --------- | ---------------------------------------------------------------- |
| `valid`   | Signature verified against the registered public key.            |
| `invalid` | Signature present but verification failed.                       |
| `missing` | No signature field in the payload, or no signing key registered. |

---

## Uploading an ABI

### Via the REST API

```bash
curl -X POST https://api.soroscan.io/api/contracts/C.../abi/ \
  -H "Authorization: ApiKey <your-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "abi_json": [
      {
        "name": "transfer",
        "fields": [
          {"name": "from",   "type": "Address"},
          {"name": "to",     "type": "Address"},
          {"name": "amount", "type": "I128"}
        ]
      }
    ]
  }'
```

### Via the Django shell

```python
from soroscan.ingest.models import ContractABI, TrackedContract

contract = TrackedContract.objects.get(contract_id="C...")
abi, created = ContractABI.objects.update_or_create(
    contract=contract,
    defaults={
        "abi_json": [
            {
                "name": "transfer",
                "fields": [
                    {"name": "from",   "type": "Address"},
                    {"name": "to",     "type": "Address"},
                    {"name": "amount", "type": "I128"},
                ],
            }
        ]
    },
)
```

---

## Re-decoding Historical Events

After uploading or updating an ABI, existing events with `decoding_status="no_abi"` or `decoding_status="failed"` can be
re-decoded using the `reprocess_events` management command:

```bash
python manage.py reprocess_events \
    --contract-id C... \
    --batch-size 500
```

This re-runs ABI decoding (`_try_decode_event`), schema validation (`validate_event_payload`), and signature
verification (`resolve_signature_status`) for every event of the contract, updating `decoded_payload`,
`decoding_status`, `validation_status`, and `signature_status` in place.

Use `--dry-run` first to preview how many events will be affected:

```bash
python manage.py reprocess_events --contract-id C... --dry-run
```

Use `--checkpoint-id` to resume a partial run from a known event ID:

```bash
python manage.py reprocess_events --contract-id C... --checkpoint-id 88500
```

See [backfilling.md](./backfilling.md) for full `reprocess_events` parameter reference.

---

## Querying Decoded Payloads

Once decoded, `ContractEvent.decoded_payload` is a plain JSON object queryable via Django's JSONField lookups:

```python
from soroscan.ingest.models import ContractEvent

# All transfer events where amount > 1,000,000
ContractEvent.objects.filter(
    event_type="transfer",
    decoding_status="success",
    decoded_payload__amount__gt=1_000_000,
)

# All transfers to a specific address
ContractEvent.objects.filter(
    event_type="transfer",
    decoded_payload__to="GXYZ...",
)
```

The GraphQL API also exposes `decodedPayload` and `decodingStatus` on the `ContractEvent` type, allowing clients to
filter and sort on decoded fields directly.
