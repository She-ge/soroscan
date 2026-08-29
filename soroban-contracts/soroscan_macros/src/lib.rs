/*!
 * Procedural macros for standardized SoroScan event emission.
 *
 * This crate provides the `emit_soroscan_event!` macro which simplifies
 * standardized event topic and data formatting for SoroScan-indexed events.
 */

extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;

/// Emit a standardized SoroScan event with topics and payload.
///
/// This macro simplifies event emission by:
/// - Automatically formatting topics as (symbol_short!("soroscan"), event_type)
/// - Ensuring consistent XDR encoding of topics and data
/// - Reducing boilerplate for event emission
///
/// # Syntax
/// ```ignore
/// emit_soroscan_event!(env, event_type_symbol, payload_data)
/// ```
///
/// # Example
/// ```ignore
/// emit_soroscan_event!(env, symbol_short!("swap"), (
///     sender,
///     receiver,
///     amount
/// ));
/// ```
///
/// # Expands to
/// ```ignore
/// env.events().publish(
///     (symbol_short!("soroscan"), symbol_short!("swap")),
///     (sender, receiver, amount)
/// )
/// ```
#[proc_macro]
#[allow(clippy::needless_pass_by_value)]
pub fn emit_soroscan_event(input: TokenStream) -> TokenStream {
    // Parse the input as three comma-separated tokens
    let input_str = input.to_string();
    let tokens: Vec<&str> = input_str.split(',').map(|s| s.trim()).collect();

    if tokens.len() != 3 {
        return syn::Error::new_spanned(
            proc_macro2::TokenStream::from(input),
            "Expected: emit_soroscan_event!(env, event_type, payload)",
        )
        .to_compile_error()
        .into();
    }

    let env_expr = tokens[0];
    let event_type = tokens[1];
    let payload = tokens[2];

    let env_tokens: proc_macro2::TokenStream = env_expr.parse().unwrap_or_default();
    let event_tokens: proc_macro2::TokenStream = event_type.parse().unwrap_or_default();
    let payload_tokens: proc_macro2::TokenStream = payload.parse().unwrap_or_default();

    let expanded = quote! {
        {
            use soroban_sdk::symbol_short;
            #env_tokens.events().publish(
                (symbol_short!("soroscan"), #event_tokens),
                #payload_tokens
            )
        }
    };

    TokenStream::from(expanded)
}

/// Emit a batch of SoroScan events with summary.
///
/// This macro simplifies batch event emission by:
/// - Automatically formatting batch topic as (symbol_short!("soroscan"), symbol_short!("batch"))
/// - Encoding batch metadata consistently
/// - Reducing boilerplate for batch operations
///
/// # Syntax
/// ```ignore
/// emit_soroscan_batch!(env, indexer, event_count, total_count)
/// ```
///
/// # Example
/// ```ignore
/// emit_soroscan_batch!(env, indexer_addr, 5, 42)
/// ```
///
/// # Expands to
/// ```ignore
/// env.events().publish(
///     (symbol_short!("soroscan"), symbol_short!("batch")),
///     (indexer_addr, 5, 42)
/// )
/// ```
#[proc_macro]
#[allow(clippy::needless_pass_by_value)]
pub fn emit_soroscan_batch(input: TokenStream) -> TokenStream {
    let input_str = input.to_string();
    let tokens: Vec<&str> = input_str.split(',').map(|s| s.trim()).collect();

    if tokens.len() != 4 {
        return syn::Error::new_spanned(
            proc_macro2::TokenStream::from(input),
            "Expected: emit_soroscan_batch!(env, indexer, event_count, total_count)",
        )
        .to_compile_error()
        .into();
    }

    let env_expr = tokens[0];
    let indexer = tokens[1];
    let event_count = tokens[2];
    let total_count = tokens[3];

    let env_tokens: proc_macro2::TokenStream = env_expr.parse().unwrap_or_default();
    let indexer_tokens: proc_macro2::TokenStream = indexer.parse().unwrap_or_default();
    let event_count_tokens: proc_macro2::TokenStream = event_count.parse().unwrap_or_default();
    let total_count_tokens: proc_macro2::TokenStream = total_count.parse().unwrap_or_default();

    let expanded = quote! {
        {
            use soroban_sdk::symbol_short;
            #env_tokens.events().publish(
                (symbol_short!("soroscan"), symbol_short!("batch")),
                (#indexer_tokens, #event_count_tokens, #total_count_tokens)
            )
        }
    };

    TokenStream::from(expanded)
}

/// Format an event topic vector with consistent naming.
///
/// This macro ensures standardized topic field naming by:
/// - Validating topic identifiers are valid symbols
/// - Converting to symbol_short! automatically
/// - Maintaining consistent formatting across events
///
/// # Syntax
/// ```ignore
/// soroscan_topics![event_name, field1, field2, ...]
/// ```
///
/// # Example
/// ```ignore
/// soroscan_topics![swap, from, to, amount]
/// ```
///
/// # Expands to topics vector
#[proc_macro]
#[allow(clippy::needless_pass_by_value)]
pub fn soroscan_topics(input: TokenStream) -> TokenStream {
    let input_str = input.to_string();
    let identifiers: Vec<&str> = input_str.split(',').map(|s| s.trim()).collect();

    if identifiers.is_empty() {
        return syn::Error::new_spanned(
            proc_macro2::TokenStream::from(input),
            "Expected at least one topic identifier",
        )
        .to_compile_error()
        .into();
    }

    // Validate all identifiers are valid Rust identifiers
    for id in &identifiers {
        if !is_valid_identifier(id) {
            return syn::Error::new_spanned(
                proc_macro2::TokenStream::from(input),
                format!("Invalid identifier: {}", id),
            )
            .to_compile_error()
            .into();
        }
    }

    // Generate symbol_short! calls for each identifier
    let symbol_shorts: Vec<proc_macro2::TokenStream> = identifiers
        .iter()
        .map(|id| {
            let id_tokens: proc_macro2::TokenStream = id.parse().unwrap_or_default();
            quote! {
                symbol_short!(#id_tokens)
            }
        })
        .collect();

    let expanded = quote! {
        {
            use soroban_sdk::{symbol_short, Vec};
            let mut topics = Vec::new(env);
            #(topics.push_back(#symbol_shorts);)*
            topics
        }
    };

    TokenStream::from(expanded)
}

/// Check if a string is a valid Rust identifier
fn is_valid_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }

    let first_char = s.chars().next().unwrap();
    if !first_char.is_alphabetic() && first_char != '_' {
        return false;
    }

    s.chars().all(|c| c.is_alphanumeric() || c == '_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_valid_identifier_valid() {
        assert!(is_valid_identifier("swap"));
        assert!(is_valid_identifier("transfer_v2"));
        assert!(is_valid_identifier("_private"));
        assert!(is_valid_identifier("EVENT_TYPE123"));
    }

    #[test]
    fn test_is_valid_identifier_invalid() {
        assert!(!is_valid_identifier(""));
        assert!(!is_valid_identifier("123invalid"));
        assert!(!is_valid_identifier("invalid-type"));
        assert!(!is_valid_identifier("invalid.type"));
    }
}
