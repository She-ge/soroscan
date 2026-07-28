#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Map,
    Symbol, Vec,
};

// Storage keys
const ADMIN_KEY: Symbol = symbol_short!("admin");
const INDEXERS_KEY: Symbol = symbol_short!("idxrs");
const COUNTER_KEY: Symbol = symbol_short!("count");

/// Represents a recorded event from an indexed contract.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventRecord {
    /// The contract that emitted the original event.
    pub contract_id: Address,
    /// The type/category of the event.
    pub event_type: Symbol,
    /// SHA-256 hash of the event payload for verification.
    pub payload_hash: BytesN<32>,
    /// Ledger sequence number when recorded.
    pub ledger: u32,
    /// Unix timestamp when recorded.
    pub timestamp: u64,
}

/// A single event entry used in batch recording (SC-29).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventEntry {
    /// The contract that emitted the original event.
    pub contract_id: Address,
    /// The type/category of the event.
    pub event_type: Symbol,
    /// SHA-256 hash of the event payload for verification.
    pub payload_hash: BytesN<32>,
}

/// Contract errors with explicit error codes.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    /// Caller is not authorized to perform this action.
    Unauthorized = 1,
    /// The specified indexer address is not registered.
    IndexerNotFound = 2,
    /// Contract has already been initialized.
    AlreadyInitialized = 3,
    /// Contract has not been initialized.
    NotInitialized = 4,
    /// Batch is empty or exceeds the maximum allowed size.
    InvalidBatchSize = 5,
}

#[contract]
pub struct SoroScanCore;

#[contractimpl]
impl SoroScanCore {
    /// Initialize the contract with an admin address.
    /// Can only be called once.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `admin` - The admin address that can manage indexers
    pub fn init(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&ADMIN_KEY) {
            return Err(ContractError::AlreadyInitialized);
        }

        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage()
            .instance()
            .set(&INDEXERS_KEY, &Map::<Address, bool>::new(&env));
        env.storage().instance().set(&COUNTER_KEY, &0u64);

        Ok(())
    }

    /// Add an authorized indexer address.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `admin` - The admin address (must match stored admin)
    /// * `indexer` - The indexer address to authorize
    pub fn add_indexer(env: Env, admin: Address, indexer: Address) -> Result<(), ContractError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(ContractError::NotInitialized)?;

        if admin != stored_admin {
            return Err(ContractError::Unauthorized);
        }

        let mut indexers: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&INDEXERS_KEY)
            .ok_or(ContractError::NotInitialized)?;

        indexers.set(indexer.clone(), true);
        env.storage().instance().set(&INDEXERS_KEY, &indexers);

        // Emit event for indexer addition
        env.events()
            .publish((symbol_short!("indexer"), symbol_short!("add")), indexer);

        Ok(())
    }

    /// Remove an authorized indexer address.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `admin` - The admin address (must match stored admin)
    /// * `indexer` - The indexer address to remove
    pub fn remove_indexer(env: Env, admin: Address, indexer: Address) -> Result<(), ContractError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(ContractError::NotInitialized)?;

        if admin != stored_admin {
            return Err(ContractError::Unauthorized);
        }

        let mut indexers: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&INDEXERS_KEY)
            .ok_or(ContractError::NotInitialized)?;

        indexers.remove(indexer.clone());
        env.storage().instance().set(&INDEXERS_KEY, &indexers);

        // Emit event for indexer removal
        env.events()
            .publish((symbol_short!("indexer"), symbol_short!("rem")), indexer);

        Ok(())
    }

    /// Record an event from an indexed contract.
    /// Only authorized indexers can call this function.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `indexer` - The indexer address (must be authorized)
    /// * `contract_id` - The contract that emitted the original event
    /// * `event_type` - The type/category of the event
    /// * `payload_hash` - SHA-256 hash of the event payload
    ///
    /// # Returns
    /// The new total event count
    pub fn record_event(
        env: Env,
        indexer: Address,
        contract_id: Address,
        event_type: Symbol,
        payload_hash: BytesN<32>,
    ) -> Result<u64, ContractError> {
        indexer.require_auth();

        let indexers: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&INDEXERS_KEY)
            .ok_or(ContractError::NotInitialized)?;

        let is_allowed = indexers.get(indexer).unwrap_or(false);
        if !is_allowed {
            return Err(ContractError::IndexerNotFound);
        }

        let ledger = env.ledger().sequence();
        let timestamp = env.ledger().timestamp();

        let record = EventRecord {
            contract_id,
            event_type: event_type.clone(),
            payload_hash,
            ledger,
            timestamp,
        };

        // Increment counter with overflow protection
        let mut count: u64 = env.storage().instance().get(&COUNTER_KEY).unwrap_or(0);
        count = count.saturating_add(1);
        env.storage().instance().set(&COUNTER_KEY, &count);

        // Store latest event by type
        env.storage().instance().set(&event_type, &record);

        // Publish the event for off-chain indexers
        env.events()
            .publish((symbol_short!("soroscan"), event_type), record);

        Ok(count)
    }

    /// Get the latest event record for a specific event type.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `event_type` - The event type to query
    ///
    /// # Returns
    /// The latest EventRecord for the type, or None if not found
    pub fn latest_by_type(env: Env, event_type: Symbol) -> Option<EventRecord> {
        env.storage().instance().get(&event_type)
    }

    /// Get the total number of events recorded.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    ///
    /// # Returns
    /// The total event count
    pub fn total_events(env: Env) -> u64 {
        env.storage().instance().get(&COUNTER_KEY).unwrap_or(0)
    }

    /// Check if an address is an authorized indexer.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `indexer` - The address to check
    ///
    /// # Returns
    /// true if the address is authorized, false otherwise
    pub fn is_indexer(env: Env, indexer: Address) -> bool {
        let indexers: Option<Map<Address, bool>> = env.storage().instance().get(&INDEXERS_KEY);
        match indexers {
            Some(map) => map.get(indexer).unwrap_or(false),
            None => false,
        }
    }

    /// Record multiple events in a single transaction (SC-29).
    /// Only authorized indexers can call this function.
    /// Maximum batch size is 25 events.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `indexer` - The indexer address (must be authorized)
    /// * `events` - Vec of EventEntry structs to record
    ///
    /// # Returns
    /// The new total event count after recording all events
    pub fn record_events_batch(
        env: Env,
        indexer: Address,
        events: Vec<EventEntry>,
    ) -> Result<u64, ContractError> {
        indexer.require_auth();

        let batch_len = events.len();
        if batch_len == 0 || batch_len > 25 {
            return Err(ContractError::InvalidBatchSize);
        }

        let indexers: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&INDEXERS_KEY)
            .ok_or(ContractError::NotInitialized)?;

        let is_allowed = indexers.get(indexer.clone()).unwrap_or(false);
        if !is_allowed {
            return Err(ContractError::IndexerNotFound);
        }

        let ledger = env.ledger().sequence();
        let timestamp = env.ledger().timestamp();
        let mut count: u64 = env.storage().instance().get(&COUNTER_KEY).unwrap_or(0);

        for entry in events.iter() {
            let record = EventRecord {
                contract_id: entry.contract_id.clone(),
                event_type: entry.event_type.clone(),
                payload_hash: entry.payload_hash.clone(),
                ledger,
                timestamp,
            };

            count = count.saturating_add(1);
            env.storage()
                .instance()
                .set(&entry.event_type, &record);

            env.events().publish(
                (symbol_short!("soroscan"), entry.event_type.clone()),
                record,
            );
        }

        env.storage().instance().set(&COUNTER_KEY, &count);

        // Emit a single batch summary event
        env.events().publish(
            (symbol_short!("soroscan"), symbol_short!("batch")),
            (indexer, batch_len, count),
        );

        Ok(count)
    }

    /// Transfer admin rights to a new address (SC-29).
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `admin` - Current admin address
    /// * `new_admin` - New admin address
    pub fn transfer_admin(
        env: Env,
        admin: Address,
        new_admin: Address,
    ) -> Result<(), ContractError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(ContractError::NotInitialized)?;

        if admin != stored_admin {
            return Err(ContractError::Unauthorized);
        }

        env.storage().instance().set(&ADMIN_KEY, &new_admin);

        env.events().publish(
            (symbol_short!("admin"), symbol_short!("xfer")),
            (stored_admin, new_admin),
        );

        Ok(())
    }

    /// Get the admin address.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    ///
    /// # Returns
    /// The admin address, or None if not initialized
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&ADMIN_KEY)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_init() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(&admin);

        assert_eq!(client.get_admin(), Some(admin));
        assert_eq!(client.total_events(), 0);
    }

    #[test]
    fn test_add_and_remove_indexer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);

        client.init(&admin);

        assert!(!client.is_indexer(&indexer));

        client.add_indexer(&admin, &indexer);
        assert!(client.is_indexer(&indexer));

        client.remove_indexer(&admin, &indexer);
        assert!(!client.is_indexer(&indexer));
    }

    #[test]
    fn test_record_event() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        let target_contract = Address::generate(&env);

        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let event_type = symbol_short!("swap");
        let payload_hash = BytesN::from_array(&env, &[0u8; 32]);

        let count = client.record_event(&indexer, &target_contract, &event_type, &payload_hash);
        assert_eq!(count, 1);
        assert_eq!(client.total_events(), 1);

        let latest = client.latest_by_type(&event_type);
        assert!(latest.is_some());
        assert_eq!(latest.unwrap().event_type, event_type);
    }

    #[test]
    fn test_add_indexer_as_non_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let non_admin = Address::generate(&env);
        let indexer = Address::generate(&env);

        client.init(&admin);

        // Non-admin tries to add indexer — should fail with Unauthorized
        let result = client.try_add_indexer(&non_admin, &indexer);
        assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
    }

    #[test]
    fn test_record_event_not_whitelisted() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let rogue = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&admin);

        let event_type = symbol_short!("swap");
        let payload_hash = BytesN::from_array(&env, &[0u8; 32]);

        // Non-whitelisted address tries to record — should fail with IndexerNotFound
        let result = client.try_record_event(&rogue, &target, &event_type, &payload_hash);
        assert_eq!(result, Err(Ok(ContractError::IndexerNotFound)));
    }

    #[test]
    fn test_record_events_batch() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        let target1 = Address::generate(&env);
        let target2 = Address::generate(&env);

        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let mut entries = Vec::new(&env);
        entries.push_back(EventEntry {
            contract_id: target1,
            event_type: symbol_short!("swap"),
            payload_hash: BytesN::from_array(&env, &[1u8; 32]),
        });
        entries.push_back(EventEntry {
            contract_id: target2,
            event_type: symbol_short!("transfer"),
            payload_hash: BytesN::from_array(&env, &[2u8; 32]),
        });

        let count = client.record_events_batch(&indexer, &entries);
        assert_eq!(count, 2);
        assert_eq!(client.total_events(), 2);

        let swap = client.latest_by_type(&symbol_short!("swap"));
        assert!(swap.is_some());
        let transfer = client.latest_by_type(&symbol_short!("transfer"));
        assert!(transfer.is_some());
    }

    #[test]
    fn test_record_events_batch_empty() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);

        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let empty: Vec<EventEntry> = Vec::new(&env);
        let result = client.try_record_events_batch(&indexer, &empty);
        assert_eq!(result, Err(Ok(ContractError::InvalidBatchSize)));
    }

    #[test]
    fn test_record_events_batch_too_large() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);

        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let mut entries = Vec::new(&env);
        for _ in 0..26 {
            entries.push_back(EventEntry {
                contract_id: Address::generate(&env),
                event_type: symbol_short!("ev"),
                payload_hash: BytesN::from_array(&env, &[0u8; 32]),
            });
        }
        let result = client.try_record_events_batch(&indexer, &entries);
        assert_eq!(result, Err(Ok(ContractError::InvalidBatchSize)));
    }

    #[test]
    fn test_record_events_batch_unauthorized_indexer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let rogue = Address::generate(&env);

        client.init(&admin);

        let mut entries = Vec::new(&env);
        entries.push_back(EventEntry {
            contract_id: Address::generate(&env),
            event_type: symbol_short!("swap"),
            payload_hash: BytesN::from_array(&env, &[0u8; 32]),
        });

        let result = client.try_record_events_batch(&rogue, &entries);
        assert_eq!(result, Err(Ok(ContractError::IndexerNotFound)));
    }

    #[test]
    fn test_transfer_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);

        client.init(&admin);
        assert_eq!(client.get_admin(), Some(admin.clone()));

        client.transfer_admin(&admin, &new_admin);
        assert_eq!(client.get_admin(), Some(new_admin.clone()));
    }

    #[test]
    fn test_transfer_admin_unauthorized() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let non_admin = Address::generate(&env);
        let new_admin = Address::generate(&env);

        client.init(&admin);

        let result = client.try_transfer_admin(&non_admin, &new_admin);
        assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
    }

    #[test]
    fn test_double_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(&admin);

        // Second init should fail with AlreadyInitialized
        let result = client.try_init(&admin);
        assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
    }
}
