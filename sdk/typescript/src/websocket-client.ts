/**
 * WebSocket client for real-time event streaming from SoroScan.
 * Includes exponential backoff reconnection logic and event buffering.
 */

import type { ContractEvent, ContractEventTopic, EventType } from "./types";

/**
 * Configuration for WebSocket connection and reconnection behavior.
 */
export interface WebSocketClientConfig {
  /** Base URL of the SoroScan WebSocket server (e.g., "wss://api.soroscan.io") */
  wsUrl: string;

  /** Optional API key for authentication */
  apiKey?: string;

  /** Initial reconnection delay in milliseconds (default: 1000) */
  initialReconnectDelay?: number;

  /** Maximum reconnection delay in milliseconds (default: 30000) */
  maxReconnectDelay?: number;

  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;

  /** Whether to add jitter to reconnection delays (default: true) */
  useJitter?: boolean;

  /** Maximum messages to buffer while disconnected (default: 1000) */
  maxBufferSize?: number;
}

/**
 * Callback function types for WebSocket events
 */
export type EventCallback = (event: ContractEvent) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: Error) => void;
export type ReconnectingCallback = (attempt: number, delay: number) => void;

/**
 * Subscription filter for events
 */
export interface EventFilter {
  /** Filter by contract ID */
  contractId?: string;

  /** Filter by event type */
  eventType?: EventType;

  /** Filter by topics */
  topics?: Partial<ContractEventTopic>[];
}

/**
 * Event listener registration
 */
interface EventListener {
  callback: EventCallback;
  filter?: EventFilter;
}

/**
 * WebSocket client for streaming real-time contract events with auto-reconnection.
 *
 * Features:
 * - Exponential backoff reconnection with jitter
 * - Message buffering while disconnected
 * - Multiple event listeners with filtering
 * - Graceful connection management
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private apiKey: string | undefined;

  private initialReconnectDelay: number;
  private maxReconnectDelay: number;
  private backoffMultiplier: number;
  private useJitter: boolean;
  private maxBufferSize: number;

  private reconnectDelay: number;
  private reconnectAttempts: number = 0;
  private isManuallyClosed: boolean = false;

  private messageBuffer: string[] = [];
  private eventListeners: EventListener[] = [];

  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private disconnectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectingCallbacks: Set<ReconnectingCallback> = new Set();
  private reconnectedCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  constructor(config: WebSocketClientConfig) {
    this.wsUrl = config.wsUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.initialReconnectDelay = config.initialReconnectDelay ?? 1000;
    this.maxReconnectDelay = config.maxReconnectDelay ?? 30000;
    this.backoffMultiplier = config.backoffMultiplier ?? 2;
    this.useJitter = config.useJitter ?? true;
    this.maxBufferSize = config.maxBufferSize ?? 1000;
    this.reconnectDelay = this.initialReconnectDelay;
  }

  /**
   * Connect to the WebSocket server.
   * Returns a promise that resolves when the connection is established.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManuallyClosed = false;
        const url = this.buildWebSocketUrl();
        this.ws = new WebSocket(url);

        this.ws.addEventListener("open", () => {
          this.handleConnectionOpen();
          this.reconnectAttempts = 0;
          this.reconnectDelay = this.initialReconnectDelay;
          resolve();
        });

        this.ws.addEventListener("message", (event) => {
          this.handleMessage(event.data);
        });

        this.ws.addEventListener("error", (event) => {
          const error = new Error(`WebSocket error: ${event}`);
          this.errorCallbacks.forEach((cb) => cb(error));
          reject(error);
        });

        this.ws.addEventListener("close", () => {
          this.handleConnectionClose();
        });
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to create WebSocket connection")
        );
      }
    });
  }

  /**
   * Disconnect from the WebSocket server.
   * If already disconnected, does nothing.
   */
  disconnect(): void {
    this.isManuallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if currently connected to the WebSocket server.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to contract events with optional filtering.
   */
  on(callback: EventCallback, filter?: EventFilter): void {
    this.eventListeners.push({ callback, filter });
  }

  /**
   * Unsubscribe a callback from events.
   */
  off(callback: EventCallback): void {
    this.eventListeners = this.eventListeners.filter((l) => l.callback !== callback);
  }

  /**
   * Register a callback for connection established.
   */
  onConnected(callback: ConnectionCallback): void {
    this.connectionCallbacks.add(callback);
  }

  /**
   * Register a callback for connection closed.
   */
  onDisconnected(callback: ConnectionCallback): void {
    this.disconnectionCallbacks.add(callback);
  }

  /**
   * Register a callback for reconnection attempts.
   * Emitted before attempting to reconnect.
   */
  onReconnecting(callback: ReconnectingCallback): void {
    this.reconnectingCallbacks.add(callback);
  }

  /**
   * Register a callback for successful reconnection.
   */
  onReconnected(callback: ConnectionCallback): void {
    this.reconnectedCallbacks.add(callback);
  }

  /**
   * Register a callback for errors.
   */
  onError(callback: ErrorCallback): void {
    this.errorCallbacks.add(callback);
  }

  /**
   * Get the current message buffer size.
   */
  getBufferSize(): number {
    return this.messageBuffer.length;
  }

  /**
   * Get the current reconnection attempt count.
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Send a subscription message to the server.
   */
  subscribe(filter?: EventFilter): void {
    if (!this.isConnected()) {
      throw new Error("WebSocket is not connected");
    }

    const message = {
      type: "subscribe",
      filter: filter || {},
    };

    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Send an unsubscribe message to the server.
   */
  unsubscribe(): void {
    if (!this.isConnected()) {
      return;
    }

    const message = { type: "unsubscribe" };
    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Build the full WebSocket URL with authentication.
   */
  private buildWebSocketUrl(): string {
    const url = new URL(this.wsUrl);

    if (this.apiKey) {
      url.searchParams.set("api_key", this.apiKey);
    }

    return url.toString();
  }

  /**
   * Handle WebSocket connection open event.
   */
  private handleConnectionOpen(): void {
    this.connectionCallbacks.forEach((cb) => cb());
    this.flushMessageBuffer();
  }

  /**
   * Handle WebSocket message received.
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === "event") {
        const event = message.data as ContractEvent;
        this.emitEvent(event);
      } else if (message.type === "error") {
        const error = new Error(message.message || "Unknown WebSocket error");
        this.errorCallbacks.forEach((cb) => cb(error));
      }
    } catch (error) {
      const parseError = error instanceof Error ? error : new Error(String(error));
      this.errorCallbacks.forEach((cb) => cb(parseError));
    }
  }

  /**
   * Handle WebSocket connection close event.
   */
  private handleConnectionClose(): void {
    this.disconnectionCallbacks.forEach((cb) => cb());

    if (!this.isManuallyClosed) {
      this.scheduleReconnect();
    }
  }

  /**
   * Emit event to all matching listeners.
   */
  private emitEvent(event: ContractEvent): void {
    this.eventListeners.forEach(({ callback, filter }) => {
      if (this.matchesFilter(event, filter)) {
        callback(event);
      }
    });
  }

  /**
   * Check if an event matches a filter.
   */
  private matchesFilter(event: ContractEvent, filter?: EventFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.contractId && event.contractId !== filter.contractId) {
      return false;
    }

    if (filter.eventType && event.type !== filter.eventType) {
      return false;
    }

    if (filter.topics) {
      const hasMatchingTopics = filter.topics.every((filterTopic) =>
        event.topics.some(
          (eventTopic) =>
            (!filterTopic.type || eventTopic.type === filterTopic.type) &&
            (!filterTopic.value || eventTopic.value === filterTopic.value)
        )
      );

      if (!hasMatchingTopics) {
        return false;
      }
    }

    return true;
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.isManuallyClosed) {
      return;
    }

    this.reconnectAttempts++;

    // Calculate delay with jitter
    let delay = this.reconnectDelay;
    if (this.useJitter) {
      // Add jitter: ±10% of the delay
      const jitterAmount = delay * 0.1;
      delay = delay + (Math.random() - 0.5) * 2 * jitterAmount;
    }

    // Emit reconnecting callback
    this.reconnectingCallbacks.forEach((cb) => cb(this.reconnectAttempts, delay));

    // Schedule reconnection
    setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectedCallbacks.forEach((cb) => cb());
      } catch (error) {
        // Error handled in connect() - continue scheduling reconnects
        this.handleConnectionClose();
      }
    }, delay);

    // Update delay for next attempt (exponential backoff)
    this.reconnectDelay = Math.min(
      this.reconnectDelay * this.backoffMultiplier,
      this.maxReconnectDelay
    );
  }

  /**
   * Flush buffered messages when connection is restored.
   */
  private flushMessageBuffer(): void {
    while (this.messageBuffer.length > 0 && this.isConnected()) {
      const message = this.messageBuffer.shift();
      if (message) {
        this.ws!.send(message);
      }
    }
  }

  /**
   * Buffer a message for later delivery if not connected.
   */
  private bufferMessage(message: string): void {
    if (this.messageBuffer.length >= this.maxBufferSize) {
      this.messageBuffer.shift(); // Remove oldest message
    }
    this.messageBuffer.push(message);
  }

  /**
   * Send a message, buffering if necessary.
   */
  private sendMessage(message: string): void {
    if (this.isConnected()) {
      this.ws!.send(message);
    } else {
      this.bufferMessage(message);
    }
  }
}
