//! Feature SC-31: Batch Event Emission
use soroban_sdk::{Env, Symbol, Vec};

pub fn emit_sc31_batch_event(e: &Env, topic: Symbol, items: Vec<Symbol>) {
    e.events().publish((Symbol::new(e, "SC31_BATCH"), topic), items);
}
