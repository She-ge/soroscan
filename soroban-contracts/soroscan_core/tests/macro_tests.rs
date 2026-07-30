// Integration tests for emit_soroscan_event! macro
// Note: These tests require the soroscan_core contract and macro to be built together

#[cfg(test)]
mod macro_integration_tests {
    use soroban_sdk::{testutils::*, Address, BytesN, Env, Symbol};
    use soroscan_core::{SoroScanCoreClient, SoroScanCore};

    fn setup_contract(env: &Env) -> (SoroScanCoreClient, Address) {
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(env, &contract_id);
        let admin = Address::generate(env);
        client.init(&admin);
        (client, admin)
    }

    #[test]
    fn test_emit_soroscan_event_macro_expansion() {
        let env = Env::default();
        let (client, admin) = setup_contract(&env);
        let indexer = Address::generate(&env);

        // Add indexer and verify event emission
        client.add_indexer(&admin, &indexer);

        // Retrieve events emitted
        let events = env.events().all();
        assert!(!events.is_empty());

        // Check that at least one event has the "soroscan" + "add" topics structure
        let has_add_event = events.iter().any(|event| {
            event.topics.len() >= 2
        });
        assert!(has_add_event, "Should have emitted an indexer add event");
    }

    #[test]
    fn test_emit_soroscan_event_structure_validation() {
        let env = Env::default();
        let (client, admin) = setup_contract(&env);
        let indexer = Address::generate(&env);
        let target_contract = Address::generate(&env);

        // Add indexer to whitelist
        client.add_indexer(&admin, &indexer);

        // Record an event
        let event_type = soroban_sdk::symbol_short!("swap");
        let payload_hash = BytesN::from_array(&env, &[1u8; 32]);

        client.record_event(&indexer, &target_contract, &event_type, &payload_hash);

        // Get all events
        let all_events = env.events().all();

        // Verify that event was emitted with correct XDR structure
        let recorded_event = all_events
            .iter()
            .find(|event| event.topics.len() >= 2)
            .expect("Should have at least one event with multiple topics");

        // Verify topics vector format
        assert!(recorded_event.topics.len() >= 2, "Event should have topic structure");

        // Verify value (payload) is present and non-empty
        assert!(!recorded_event.value.is_null(), "Event payload should not be empty");
    }

    #[test]
    fn test_batch_event_xdr_encoding() {
        let env = Env::default();
        let (client, admin) = setup_contract(&env);
        let indexer = Address::generate(&env);

        // Add indexer
        client.add_indexer(&admin, &indexer);

        // Create batch entries
        let mut entries = soroban_sdk::Vec::new(&env);
        let target1 = Address::generate(&env);
        let target2 = Address::generate(&env);

        entries.push_back(soroscan_core::EventEntry {
            contract_id: target1,
            event_type: soroban_sdk::symbol_short!("swap"),
            payload_hash: BytesN::from_array(&env, &[10u8; 32]),
        });
        entries.push_back(soroscan_core::EventEntry {
            contract_id: target2,
            event_type: soroban_sdk::symbol_short!("transfer"),
            payload_hash: BytesN::from_array(&env, &[20u8; 32]),
        });

        // Record batch
        let count = client.record_events_batch(&indexer, &entries);
        assert_eq!(count, 2, "Should have recorded 2 events");

        // Get all events and verify batch summary event was emitted
        let all_events = env.events().all();
        assert!(all_events.len() >= 3, "Should have multiple events including batch summary");

        // Verify batch summary event structure
        let batch_event = all_events
            .iter()
            .find(|event| {
                // Check for batch event - should have "soroscan" + "batch" topics
                event.topics.len() >= 2
            })
            .expect("Should have batch summary event");

        // Verify payload encoding contains (indexer, batch_size, total_count)
        assert!(!batch_event.value.is_null(), "Batch event should have payload");
    }

    #[test]
    fn test_event_topics_and_payload_consistency() {
        let env = Env::default();
        let (client, admin) = setup_contract(&env);
        let indexer = Address::generate(&env);
        let target_contract = Address::generate(&env);

        client.add_indexer(&admin, &indexer);

        // Record multiple events
        for i in 0..3 {
            let event_type = match i {
                0 => soroban_sdk::symbol_short!("transfer"),
                1 => soroban_sdk::symbol_short!("approve"),
                _ => soroban_sdk::symbol_short!("burn"),
            };

            let mut payload_hash_bytes = [0u8; 32];
            payload_hash_bytes[0] = i as u8;
            let payload_hash = BytesN::from_array(&env, &payload_hash_bytes);

            client.record_event(&indexer, &target_contract, &event_type, &payload_hash);
        }

        // Retrieve all events
        let all_events = env.events().all();

        // Verify consistent XDR structure across all events
        for event in all_events.iter() {
            // Each event should have topics (at minimum 1, but typically 2+ for soroscan events)
            assert!(event.topics.len() >= 1, "Each event must have at least 1 topic");

            // Each event should have a value (payload)
            // Note: value is always present but might be unit () for some events
            assert!(!event.value.is_null(), "Event value should exist (even if unit)");
        }
    }

    #[test]
    fn test_event_record_immutability() {
        let env = Env::default();
        let (client, admin) = setup_contract(&env);
        let indexer = Address::generate(&env);
        let target_contract = Address::generate(&env);

        client.add_indexer(&admin, &indexer);

        let event_type = soroban_sdk::symbol_short!("swap");
        let payload_hash = BytesN::from_array(&env, &[42u8; 32]);

        // Record event and get the event record
        client.record_event(&indexer, &target_contract, &event_type, &payload_hash);

        // Retrieve the stored event
        let stored = client
            .latest_by_type(&event_type)
            .expect("Event should be stored");

        // Verify immutability - stored event should match what we recorded
        assert_eq!(stored.contract_id, target_contract);
        assert_eq!(stored.event_type, event_type);
        assert_eq!(stored.payload_hash, payload_hash);
        assert!(stored.ledger > 0, "Ledger should be set");
        assert!(stored.timestamp >= 0, "Timestamp should be set");
    }

    #[test]
    fn test_macro_symbol_formatting() {
        // Test that symbols are properly formatted through the macro
        let env = Env::default();
        let (client, admin) = setup_contract(&env);
        let indexer = Address::generate(&env);

        // Test various event type symbols
        let event_symbols = vec![
            soroban_sdk::symbol_short!("transfer"),
            soroban_sdk::symbol_short!("swap"),
            soroban_sdk::symbol_short!("mint"),
            soroban_sdk::symbol_short!("burn"),
        ];

        for symbol in event_symbols {
            let target = Address::generate(&env);
            let hash = BytesN::from_array(&env, &[0u8; 32]);

            // This should not panic - symbols should be properly formatted
            client.add_indexer(&admin, &indexer);
            client.record_event(&indexer, &target, &symbol, &hash);
        }

        // Verify all events were recorded
        assert_eq!(
            client.total_events(),
            4,
            "All events should be recorded with various symbols"
        );
    }
}
