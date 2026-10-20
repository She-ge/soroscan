export {
  SoroScanClient,
  DEFAULT_USER_AGENT,
  // Error hierarchy — all classes exported for instanceof checks
  SoroScanError,
  SoroScanApiError,
  SoroScanAuthenticationError,
  SoroScanAuthorizationError,
  SoroScanNotFoundError,
  SoroScanRateLimitError,
  SoroScanValidationError,
  SoroScanServerError,
  SoroScanNetworkError,
  SoroScanTimeoutError,
  SoroScanConnectionError,
  Paginator,
} from "./client.js";
export { EventQueryBuilder, ContractQueryBuilder } from "./builder.js";
export { verifyWebhookSignature } from "./webhookVerification.js";
export { WebSocketClient } from "./websocket-client.js";
export { MAX_RECENT_EVENTS_LIMIT } from "./types.js";
export type {
  // Config
  SoroScanClientConfig,
  // Shared
  ISODateString,
  ContractId,
  StellarAddress,
  Network,
  LedgerEntryType,
  PageInfo,
  PaginatedResponse,
  // Events
  EventType,
  ContractEventTopic,
  ContractEvent,
  GetEventsParams,
  GetEventsResponse,
  GetEventsByContractsParams,
  GetEventsByContractsResponse,
  RecordStructuredEventParams,
  RecordStructuredEventResponse,
  // Contracts
  ContractType,
  ContractSpec,
  ContractFunction,
  ContractFunctionParam,
  ContractTypeDefinition,
  Contract,
  GetContractsParams,
  GetContractsResponse,
  GetContractParams,
  // SC-16: Contract health
  ContractHealth,
  // Transactions
  TransactionStatus,
  Transaction,
  GetTransactionsParams,
  GetTransactionsResponse,
  // Ledgers
  Ledger,
  GetLedgersParams,
  GetLedgersResponse,
  // Accounts
  AccountBalance,
  Account,
  GetAccountParams,
  // Webhooks
  WebhookTrigger,
  WebhookStatus,
  Webhook,
  SubscribeWebhookParams,
  UpdateWebhookParams,
  WebhookListResponse,
  // SC-17: Contract event type info
  ContractEventTypeInfo,
  // SC-29: Batch event recording
  EventEntry,
  RecordEventsBatchParams,
  RecordEventsBatchResponse,
  // SC-13: Per-indexer event statistics
  IndexerStats,
  // SC-28: Contract pause status
  ContractStatus,
  // SC-30: Recent contract events
  GetContractRecentEventsParams,
  // WebSocket
  WebSocketClientConfig,
  EventCallback,
  ConnectionCallback,
  ErrorCallback,
  ReconnectingCallback,
  EventFilter,
  // Errors (raw API response shape)
  SoroScanApiErrorResponse,
} from "./types.js";

export * from "./features/sc36.js";
export * from "./features/sc31.js";
export * from "./features/sc21.js";
export * from "./features/sc20.js";
