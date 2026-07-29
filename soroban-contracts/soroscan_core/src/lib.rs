#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Map,
    Symbol,
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

/// SC-38 structured event record.  This is deliberately separate from
/// `EventRecord` so clients using the original ABI continue to decode the
/// legacy event payload without a schema change.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StructuredEventRecord {
    pub contract_id: Address,
    pub event_type: Symbol,
    pub payload_hash: BytesN<32>,
    /// Producer-defined payload schema version. Must be greater than zero.
    pub schema_version: u32,
    /// Stable id supplied by the producer for safe retry/deduplication.
    pub correlation_id: BytesN<32>,
    pub ledger: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    StructuredByCorrelation(BytesN<32>),
    LatestStructuredByType(Symbol),
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
    /// SC-38 structured events require a non-zero schema version.
    InvalidSchemaVersion = 5,
    /// A structured event with this correlation ID was already submitted.
    DuplicateCorrelation = 6,
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

    /// Record an SC-38 structured event.
    ///
    /// `correlation_id` makes producer retries safe: a duplicate is rejected
    /// before incrementing the counter or publishing a second event.
    pub fn record_structured_event(
        env: Env,
        indexer: Address,
        contract_id: Address,
        event_type: Symbol,
        payload_hash: BytesN<32>,
        schema_version: u32,
        correlation_id: BytesN<32>,
    ) -> Result<u64, ContractError> {
        indexer.require_auth();

        if schema_version == 0 {
            return Err(ContractError::InvalidSchemaVersion);
        }

        let indexers: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&INDEXERS_KEY)
            .ok_or(ContractError::NotInitialized)?;
        if !indexers.get(indexer).unwrap_or(false) {
            return Err(ContractError::IndexerNotFound);
        }

        let correlation_key = DataKey::StructuredByCorrelation(correlation_id.clone());
        if env.storage().instance().has(&correlation_key) {
            return Err(ContractError::DuplicateCorrelation);
        }

        let record = StructuredEventRecord {
            contract_id,
            event_type: event_type.clone(),
            payload_hash,
            schema_version,
            correlation_id,
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };

        let count = env
            .storage()
            .instance()
            .get::<Symbol, u64>(&COUNTER_KEY)
            .unwrap_or(0)
            .saturating_add(1);
        env.storage().instance().set(&COUNTER_KEY, &count);
        env.storage().instance().set(&correlation_key, &record);
        env.storage().instance().set(
            &DataKey::LatestStructuredByType(event_type.clone()),
            &record,
        );
        env.events().publish(
            (symbol_short!("soroscan"), symbol_short!("sc38"), event_type),
            record,
        );

        Ok(count)
    }

    /// Get a structured event by its SC-38 correlation ID.
    pub fn structured_by_correlation(
        env: Env,
        correlation_id: BytesN<32>,
    ) -> Option<StructuredEventRecord> {
        env.storage()
            .instance()
            .get(&DataKey::StructuredByCorrelation(correlation_id))
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
    fn test_record_structured_event_and_deduplicates_correlation_id() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        let target = Address::generate(&env);
        let payload_hash = BytesN::from_array(&env, &[1u8; 32]);
        let correlation_id = BytesN::from_array(&env, &[2u8; 32]);

        client.init(&admin);
        client.add_indexer(&admin, &indexer);
        assert_eq!(
            client.record_structured_event(
                &indexer,
                &target,
                &symbol_short!("transfer"),
                &payload_hash,
                &1,
                &correlation_id,
            ),
            1
        );
        let record = client.structured_by_correlation(&correlation_id).unwrap();
        assert_eq!(record.schema_version, 1);
        assert_eq!(record.correlation_id, correlation_id);
        assert_eq!(client.total_events(), 1);
        assert_eq!(
            client.try_record_structured_event(
                &indexer,
                &target,
                &symbol_short!("transfer"),
                &payload_hash,
                &1,
                &correlation_id,
            ),
            Err(Ok(ContractError::DuplicateCorrelation))
        );
    }

    #[test]
    fn test_structured_event_rejects_zero_schema_version() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        assert_eq!(
            client.try_record_structured_event(
                &indexer,
                &Address::generate(&env),
                &symbol_short!("swap"),
                &BytesN::from_array(&env, &[0u8; 32]),
                &0,
                &BytesN::from_array(&env, &[3u8; 32]),
            ),
            Err(Ok(ContractError::InvalidSchemaVersion))
        );
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
