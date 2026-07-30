//! Feature SC-36: Extended Telemetry & Verification
use soroban_sdk::{Env, Symbol, Vec};

pub fn emit_sc36_telemetry_event(e: &Env, tag: Symbol, payload: Vec<Symbol>) {
    e.events().publish((Symbol::new(e, "SC36_TELEMETRY"), tag), payload);
}
