//! Feature SC-21: Event Emission with Topic Filtering
use soroban_sdk::{Env, Symbol, Vec};

pub fn emit_sc21_event(e: &Env, topic: Symbol, payload: Vec<Symbol>) {
    e.events().publish((Symbol::new(e, "SC21"), topic), payload);
}
