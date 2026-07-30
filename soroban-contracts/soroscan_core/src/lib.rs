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
#[derive(Clone)]
enum DataKey {
    StructuredByCorrelation(BytesN<32>),
    LatestStructuredByType(Symbol),
    /// SC-24: latest tagged event keyed by event_type
    LatestTaggedByType(Symbol),
}

/// Maximum number of producer-defined tags per SC-24 event.
const MAX_TAGS: u32 = 4;

/// SC-24 tagged event record.  Tags are short producer-defined strings that
/// allow off-chain indexers to filter events without decoding the full payload.
/// Kept separate from `EventRecord` and `StructuredEventRecord` to preserve
/// backward-compatible ABI for existing on-chain consumers.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TaggedEventRecord {
    pub contract_id: Address,
    pub event_type: Symbol,
    pub payload_hash: BytesN<32>,
    /// Producer-defined tags (max 4). Empty tags are permitted but ignored by
    /// the indexer when building the tag index.
    pub tags: soroban_sdk::Vec<Symbol>,
    pub ledger: u32,
    pub timestamp: u64,
}

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
    /// SC-24: the tags list exceeds the per-event maximum.
    TooManyTags = 7,
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

    /// Record an SC-24 tagged event.
    ///
    /// Works like `record_event` but accepts an optional list of producer-
    /// defined tag symbols (maximum `MAX_TAGS = 4`).  The tagged record is
    /// stored separately so the existing `record_event` / `latest_by_type`
    /// interface is unaffected.
    ///
    /// # Arguments
    /// * `env`          - The contract environment
    /// * `indexer`      - Authorized indexer address
    /// * `contract_id`  - Contract that emitted the original event
    /// * `event_type`   - Event category symbol
    /// * `payload_hash` - SHA-256 hash of the event payload (32 bytes)
    /// * `tags`         - Up to `MAX_TAGS` producer-defined classification symbols
    ///
    /// # Returns
    /// The updated global event counter, same as `record_event`.
    pub fn record_tagged_event(
        env: Env,
        indexer: Address,
        contract_id: Address,
        event_type: Symbol,
        payload_hash: BytesN<32>,
        tags: soroban_sdk::Vec<Symbol>,
    ) -> Result<u64, ContractError> {
        indexer.require_auth();

        if tags.len() > MAX_TAGS {
            return Err(ContractError::TooManyTags);
        }

        let indexers: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&INDEXERS_KEY)
            .ok_or(ContractError::NotInitialized)?;
        if !indexers.get(indexer).unwrap_or(false) {
            return Err(ContractError::IndexerNotFound);
        }

        let record = TaggedEventRecord {
            contract_id,
            event_type: event_type.clone(),
            payload_hash,
            tags,
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
        env.storage().instance().set(
            &DataKey::LatestTaggedByType(event_type.clone()),
            &record,
        );

        env.events().publish(
            (symbol_short!("soroscan"), symbol_short!("sc24"), event_type),
            record,
        );

        Ok(count)
    }

    /// Return the latest SC-24 tagged event for the given `event_type`, or
    /// `None` if no tagged event of that type has been recorded yet.
    pub fn latest_tagged_by_type(env: Env, event_type: Symbol) -> Option<TaggedEventRecord> {
        env.storage()
            .instance()
            .get(&DataKey::LatestTaggedByType(event_type))
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

    // ── SC-24 tagged event tests ──────────────────────────────────────────────

    #[test]
    fn test_record_tagged_event_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        let target = Address::generate(&env);
        let payload_hash = BytesN::from_array(&env, &[5u8; 32]);

        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let event_type = symbol_short!("transfer");
        let tags = soroban_sdk::vec![
            &env,
            symbol_short!("defi"),
            symbol_short!("token"),
        ];

        let count = client.record_tagged_event(
            &indexer,
            &target,
            &event_type,
            &payload_hash,
            &tags,
        );
        assert_eq!(count, 1);
        assert_eq!(client.total_events(), 1);

        let latest = client.latest_tagged_by_type(&event_type).unwrap();
        assert_eq!(latest.event_type, event_type);
        assert_eq!(latest.payload_hash, payload_hash);
        assert_eq!(latest.tags.len(), 2);
    }

    #[test]
    fn test_record_tagged_event_empty_tags() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let event_type = symbol_short!("mint");
        let empty_tags = soroban_sdk::vec![&env];

        let count = client.record_tagged_event(
            &indexer,
            &Address::generate(&env),
            &event_type,
            &BytesN::from_array(&env, &[6u8; 32]),
            &empty_tags,
        );
        assert_eq!(count, 1);
        let latest = client.latest_tagged_by_type(&event_type).unwrap();
        assert_eq!(latest.tags.len(), 0);
    }

    #[test]
    fn test_record_tagged_event_rejects_too_many_tags() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        // Build a tags vec with 5 elements (exceeds MAX_TAGS = 4)
        let five_tags = soroban_sdk::vec![
            &env,
            symbol_short!("a"),
            symbol_short!("b"),
            symbol_short!("c"),
            symbol_short!("d"),
            symbol_short!("e"),
        ];
        let result = client.try_record_tagged_event(
            &indexer,
            &Address::generate(&env),
            &symbol_short!("burn"),
            &BytesN::from_array(&env, &[7u8; 32]),
            &five_tags,
        );
        assert_eq!(result, Err(Ok(ContractError::TooManyTags)));
    }

    #[test]
    fn test_record_tagged_event_rejects_unauthorized_indexer() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.init(&admin);

        // No indexer registered
        let rogue = Address::generate(&env);
        let result = client.try_record_tagged_event(
            &rogue,
            &Address::generate(&env),
            &symbol_short!("swap"),
            &BytesN::from_array(&env, &[8u8; 32]),
            &soroban_sdk::vec![&env],
        );
        assert_eq!(result, Err(Ok(ContractError::IndexerNotFound)));
    }

    #[test]
    fn test_latest_tagged_by_type_returns_none_before_first_event() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.init(&admin);

        assert_eq!(client.latest_tagged_by_type(&symbol_short!("swap")), None);
    }

    #[test]
    fn test_tagged_and_legacy_event_coexist() {
        // Record both a legacy and a tagged event for the same event_type and
        // verify that the two storage slots remain independent.
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SoroScanCore);
        let client = SoroScanCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let indexer = Address::generate(&env);
        let target = Address::generate(&env);
        client.init(&admin);
        client.add_indexer(&admin, &indexer);

        let event_type = symbol_short!("swap");
        let hash_legacy = BytesN::from_array(&env, &[9u8; 32]);
        let hash_tagged = BytesN::from_array(&env, &[10u8; 32]);

        client.record_event(&indexer, &target, &event_type, &hash_legacy);
        client.record_tagged_event(
            &indexer,
            &target,
            &event_type,
            &hash_tagged,
            &soroban_sdk::vec![&env, symbol_short!("dex")],
        );

        // Legacy slot reflects legacy hash
        assert_eq!(
            client.latest_by_type(&event_type).unwrap().payload_hash,
            hash_legacy
        );
        // Tagged slot reflects tagged hash
        assert_eq!(
            client.latest_tagged_by_type(&event_type).unwrap().payload_hash,
            hash_tagged
        );
    }
}
