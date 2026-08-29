//! Feature SC-20: Extended Event Emission

use soroban_sdk::{Env, Symbol, Vec};

pub fn emit_sc20_event(e: &Env, topic: Symbol, data: Vec<Symbol>) {
    e.events().publish((Symbol::new(e, "SC20"), topic), data);
}
