//! SC-41: Extended Soroban event emission.
//!
//! Adds a structured, filterable, nonce-ordered event emission layer on top
//! of the base Soroban SDK event system (`env.events().publish`).
//!
//! Motivation
//! ----------
//! The default `env.events().publish((topic1, topic2), data)` pattern gives
//! no ordering guarantee that off-chain indexers can rely on, and no way to
//! attach a free-form memo without changing the event's data shape. This
//! module wraps event publishing so every contract event:
//!   1. Carries a monotonically increasing nonce (per-contract), so indexers
//!      can detect gaps/reordering/missed events.
//!   2. Carries a standard "kind" topic (Symbol) for filtering, plus up to
//!      two caller-supplied topics.
//!   3. Carries an optional memo (String) alongside the primary data payload.
//!
//! Folder placement
//! -----------------
//! This file is intended to live at:
//!   contracts/<your-contract-name>/src/events.rs
//!
//! and be wired into contracts/<your-contract-name>/src/lib.rs via:
//!   mod events;
//!   use events::{emit_event, EventKind};
//!
//! For a standalone demo/reference contract (as tested below), it can also
//! live at:
//!   contracts/event-emitter/src/lib.rs
//!
//! Either way, it follows the standard Soroban workspace layout:
//!   contracts/
//!     <contract-name>/
//!       src/
//!         lib.rs      <- contract entrypoints
//!         events.rs   <- this file, if kept separate
//!       Cargo.toml
//!   Cargo.toml (workspace root)

#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Env, String, Symbol};

pub mod features;

/// Standardized event kinds. Keeping this as an enum (rather than raw
/// symbols scattered through the contract) is the core of the SDK-facing
/// improvement: SDK client code can match on `EventKind` instead of
/// hardcoding topic strings, and new kinds are added in one place.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EventKind {
    Created,
    Updated,
    Deleted,
    Transferred,
    Custom,
}

impl EventKind {
    fn topic(&self, env: &Env) -> Symbol {
        match self {
            EventKind::Created => symbol_short!("created"),
            EventKind::Updated => symbol_short!("updated"),
            EventKind::Deleted => symbol_short!("deleted"),
            EventKind::Transferred => symbol_short!("transfer"),
            EventKind::Custom => symbol_short!("custom"),
        }
    }
}

/// The payload persisted into `env.events()` for every extended event.
/// `data` is left as a `String` (JSON-encoded by the caller) so this stays
/// generic across contracts; typed contracts can wrap this with their own
/// serialization if desired.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventPayload {
    pub nonce: u64,
    pub memo: String,
    pub data: String,
}

/// Storage key for the per-contract event nonce counter.
#[contracttype]
#[derive(Clone)]
enum DataKey {
    EventNonce,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EventError {
    NonceOverflow = 1,
}

/// Reads the current nonce without incrementing it. Useful for SDK clients
/// or CLI tools that want to know "how many events have been emitted so
/// far" without needing to replay the event stream.
pub fn current_nonce(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::EventNonce)
        .unwrap_or(0u64)
}

/// Emits a structured event and returns the nonce assigned to it.
///
/// `topic_a` / `topic_b` are optional caller-supplied topics layered under
/// the standardized `EventKind` topic, e.g. an account address or object id,
/// to allow narrower off-chain filtering.
pub fn emit_event(
    env: &Env,
    kind: EventKind,
    topic_a: Option<Symbol>,
    memo: String,
    data: String,
) -> Result<u64, EventError> {
    let nonce = current_nonce(env);
    let next = nonce.checked_add(1).ok_or(EventError::NonceOverflow)?;
    env.storage().instance().set(&DataKey::EventNonce, &next);

    let payload = EventPayload { nonce, memo, data };
    let kind_topic = kind.topic(env);

    match topic_a {
        Some(t) => env.events().publish((kind_topic, t), payload),
        None => env.events().publish((kind_topic,), payload),
    }

    Ok(nonce)
}

/// Minimal reference contract demonstrating the emission helper above so
/// the feature is independently testable and shows SDK-facing usage.
#[contract]
pub struct EventEmitterContract;

#[contractimpl]
impl EventEmitterContract {
    /// Emits a "Created" event with a memo, returning the assigned nonce.
    pub fn create(env: Env, id: Symbol, memo: String, data: String) -> u64 {
        emit_event(&env, EventKind::Created, Some(id), memo, data)
            .expect("event nonce overflow")
    }

    /// Emits an "Updated" event with a memo, returning the assigned nonce.
    pub fn update(env: Env, id: Symbol, memo: String, data: String) -> u64 {
        emit_event(&env, EventKind::Updated, Some(id), memo, data)
            .expect("event nonce overflow")
    }

    /// Returns how many events this contract has emitted so far.
    pub fn event_count(env: Env) -> u64 {
        current_nonce(&env)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Events, vec, Env, IntoVal};

    #[test]
    fn nonces_increment_and_are_returned() {
        let env = Env::default();
        let contract_id = env.register(EventEmitterContract, ());
        let client = EventEmitterContractClient::new(&env, &contract_id);

        let id = symbol_short!("obj1");
        let n0 = client.create(&id, &String::from_str(&env, "first"), &String::from_str(&env, "{}"));
        let n1 = client.update(&id, &String::from_str(&env, "second"), &String::from_str(&env, "{}"));

        assert_eq!(n0, 0);
        assert_eq!(n1, 1);
        assert_eq!(client.event_count(), 2);
    }

    #[test]
    fn event_topics_and_payload_are_structured() {
        let env = Env::default();
        let contract_id = env.register(EventEmitterContract, ());
        let client = EventEmitterContractClient::new(&env, &contract_id);

        let id = symbol_short!("obj1");
        let memo = String::from_str(&env, "hello");
        let data = String::from_str(&env, "{\"x\":1}");
        client.create(&id, &memo, &data);

        let events = env.events().all();
        assert_eq!(events.len(), 1);

        let (emitted_contract_id, topics, payload) = events.get(0).unwrap();
        assert_eq!(emitted_contract_id, contract_id);

        let expected_topics = vec![&env, symbol_short!("created").into_val(&env), id.into_val(&env)];
        assert_eq!(topics, expected_topics);

        let expected_payload: EventPayload = EventPayload {
            nonce: 0,
            memo: memo.clone(),
            data: data.clone(),
        };
        assert_eq!(payload, expected_payload.into_val(&env));
    }

    #[test]
    fn distinct_ids_still_share_one_monotonic_nonce_stream() {
        let env = Env::default();
        let contract_id = env.register(EventEmitterContract, ());
        let client = EventEmitterContractClient::new(&env, &contract_id);

        let a = symbol_short!("a");
        let b = symbol_short!("b");
        let empty = String::from_str(&env, "");

        let n0 = client.create(&a, &empty, &empty);
        let n1 = client.create(&b, &empty, &empty);
        let n2 = client.update(&a, &empty, &empty);

        assert_eq!((n0, n1, n2), (0, 1, 2));
    }
}