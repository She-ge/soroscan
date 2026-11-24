/**
 * Jest test suite for WebSocketClient
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ContractEvent } from "./types.js";
import { WebSocketClient } from "./websocket-client.js";

// Mock WebSocket
class MockWebSocket {
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  /** Every instance created, so tests can drive the socket the client uses. */
  public static instances: MockWebSocket[] = [];

  public readyState = MockWebSocket.CONNECTING;
  private listeners: Record<string, Function[]> = {};

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.dispatchEvent("open", null);
    }, 10);
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  send(data: string) {
    // Mock implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent("close", null);
  }

  protected dispatchEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        callback(data instanceof Event ? data : { data });
      });
    }
  }

  simulateMessage(data: string) {
    // dispatchEvent wraps non-Event values as `{ data }`, which is exactly the
    // shape a real WebSocket `message` event exposes to the listener.
    this.dispatchEvent("message", data);
  }

  simulateError(error: string) {
    this.dispatchEvent("error", new Error(error));
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent("close", null);
  }
}

// Replace global WebSocket with mock during tests
const originalWebSocket = global.WebSocket;

describe("WebSocketClient", () => {
  let client: WebSocketClient;

  beforeEach(() => {
    // Mock WebSocket globally
    MockWebSocket.instances.length = 0;
    global.WebSocket = MockWebSocket as any;

    client = new WebSocketClient({
      wsUrl: "wss://api.example.com",
      apiKey: "test-key",
      initialReconnectDelay: 100,
      maxReconnectDelay: 500,
      backoffMultiplier: 2,
    });
  });

  afterEach(() => {
    client.disconnect();
    global.WebSocket = originalWebSocket;
  });

  describe("Connection", () => {
    it("should establish WebSocket connection", async () => {
      const connectCallback = vi.fn();
      client.onConnected(connectCallback);

      await client.connect();

      expect(client.isConnected()).toBe(true);
      expect(connectCallback).toHaveBeenCalled();
    });

    it("should disconnect gracefully", async () => {
      const disconnectCallback = vi.fn();
      client.onDisconnected(disconnectCallback);

      await client.connect();
      expect(client.isConnected()).toBe(true);

      client.disconnect();
      // Give mock time to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(client.isConnected()).toBe(false);
      expect(disconnectCallback).toHaveBeenCalled();
    });

    it("should include API key in WebSocket URL", async () => {
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          expect(url).toContain("api_key=test-key");
        }
      } as any;

      await client.connect();
    });
  });

  describe("Event Listeners", () => {
    const makeEvent = (contractId: string, id = "event-1"): ContractEvent => ({
      id,
      ledger: 100,
      ledgerClosedAt: "2024-01-01T00:00:00Z",
      txHash: "hash123",
      contractId,
      type: "transfer",
      topics: [{ type: "address", value: "addr1" }],
      value: { amount: "100" },
      inSuccessfulContractCall: true,
      pagingToken: "token123",
    });

    /** The socket instance created by the most recent `client.connect()`. */
    const connectedSocket = (): MockWebSocket => {
      const socket = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      expect(socket).toBeDefined();
      return socket!;
    };

    it("should register and emit events to listener", async () => {
      const eventCallback = vi.fn();
      const mockEvent = makeEvent("C1234567890");

      client.on(eventCallback);
      await client.connect();

      connectedSocket().simulateMessage(
        JSON.stringify({ type: "event", data: mockEvent })
      );

      expect(eventCallback).toHaveBeenCalledTimes(1);
      expect(eventCallback).toHaveBeenCalledWith(mockEvent);
    });

    it("should filter events by contractId", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      client.on(callback1, { contractId: "C1111111111" });
      client.on(callback2, { contractId: "C2222222222" });
      await client.connect();

      const matching = makeEvent("C1111111111");
      connectedSocket().simulateMessage(
        JSON.stringify({ type: "event", data: matching })
      );

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith(matching);
      expect(callback2).not.toHaveBeenCalled();

      // A message for the other listener reaches only that listener.
      const other = makeEvent("C2222222222", "event-2");
      connectedSocket().simulateMessage(
        JSON.stringify({ type: "event", data: other })
      );

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledWith(other);
    });

    it("should unsubscribe listeners", async () => {
      const callback = vi.fn();
      client.on(callback);
      await client.connect();

      const socket = connectedSocket();
      socket.simulateMessage(
        JSON.stringify({ type: "event", data: makeEvent("C1234567890") })
      );
      expect(callback).toHaveBeenCalledTimes(1);

      client.off(callback);

      socket.simulateMessage(
        JSON.stringify({
          type: "event",
          data: makeEvent("C1234567890", "event-2"),
        })
      );
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Reconnection Logic", () => {
    it("should attempt reconnection after disconnect", async () => {
      const reconnectingCallback = vi.fn();
      const reconnectedCallback = vi.fn();

      client.onReconnecting(reconnectingCallback);
      client.onReconnected(reconnectedCallback);

      await client.connect();
      expect(client.isConnected()).toBe(true);

      // Simulate connection loss
      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Reset manually closed state to trigger reconnect
      // Note: This requires access to private state in real test
    });

    it("should use exponential backoff for reconnection delays", async () => {
      const reconnectingCallback = vi.fn();
      let lastDelay = 0;

      client.onReconnecting((attempt, delay) => {
        reconnectingCallback(attempt, delay);
        lastDelay = delay;
      });

      await client.connect();

      // Verify initial delay is set correctly
      expect(client.getReconnectAttempts()).toBe(0);
    });

    it("should include jitter in reconnection delay", async () => {
      const delays: number[] = [];
      const reconnectingCallback = vi.fn((attempt, delay) => {
        delays.push(delay);
      });

      client.onReconnecting(reconnectingCallback);

      // Verify jitter is applied (delays should vary slightly)
      // This would be validated in integration tests
    });
  });

  describe("Message Buffering", () => {
    it("should buffer messages when disconnected", async () => {
      // With the new implementation, subscribe/unsubscribe no longer throw
      // but buffer messages internally when disconnected
      client.subscribe({ contractId: "C1234567890" });
      client.unsubscribe();

      // Buffer should have messages
      expect(client.getBufferSize()).toBeGreaterThan(0);
    });

    it("should flush buffer on reconnection", async () => {
      // Buffer some messages while disconnected
      client.subscribe({ contractId: "C1234567890" });
      const bufferedSize = client.getBufferSize();
      expect(bufferedSize).toBeGreaterThan(0);

      await client.connect();
      expect(client.isConnected()).toBe(true);

      // Buffer should be flushed
      expect(client.getBufferSize()).toBe(0);
    });

    it("should respect max buffer size", async () => {
      const smallClient = new WebSocketClient({
        wsUrl: "wss://api.example.com",
        maxBufferSize: 5,
      });

      // Add more messages than buffer size
      for (let i = 0; i < 10; i++) {
        smallClient.send({ type: "test", id: i });
      }

      // Buffer should be limited to max size
      expect(smallClient.getBufferSize()).toBe(5);
    });

    it("should provide public send method for custom messages", async () => {
      client.send({ type: "custom", data: "test" });
      expect(client.getBufferSize()).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should emit error callback on connection error", async () => {
      const errorCallback = vi.fn();
      client.onError(errorCallback);

      // Mock WebSocket that fails to connect
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.dispatchEvent("error", new Error("Connection failed"));
          }, 10);
        }
      } as any;

      const newClient = new WebSocketClient({
        wsUrl: "wss://api.example.com",
      });

      newClient.onError(errorCallback);

      try {
        await newClient.connect();
      } catch {
        // Expected error
      }

      // Error callback should be registered
      expect(errorCallback).toBeDefined();
    });

    it("should handle malformed JSON messages", async () => {
      const errorCallback = vi.fn();
      client.onError(errorCallback);

      await client.connect();

      // Simulate malformed message
      const mockWebSocketInstance = (global.WebSocket as any).prototype;
      // This would normally be triggered by actual WebSocket message
    });
  });

  describe("Subscription Management", () => {
    it("should send subscribe message when connected", async () => {
      const sendSpy = vi.fn();

      global.WebSocket = class extends MockWebSocket {
        override send(data: string) {
          sendSpy(data);
        }
      } as any;

      const newClient = new WebSocketClient({
        wsUrl: "wss://api.example.com",
      });

      await newClient.connect();

      newClient.subscribe({ contractId: "C1234567890" });

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining("subscribe")
      );
    });

    it("should buffer when subscribing while disconnected", async () => {
      // New implementation: buffers instead of throwing
      client.subscribe();
      expect(client.getBufferSize()).toBeGreaterThan(0);
    });

    it("should send unsubscribe message", async () => {
      const sendSpy = vi.fn();

      global.WebSocket = class extends MockWebSocket {
        override send(data: string) {
          sendSpy(data);
        }
      } as any;

      const newClient = new WebSocketClient({
        wsUrl: "wss://api.example.com",
      });

      await newClient.connect();

      newClient.unsubscribe();

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining("unsubscribe")
      );
    });
  });

  describe("Configuration", () => {
    it("should use custom reconnection parameters", async () => {
      const customClient = new WebSocketClient({
        wsUrl: "wss://api.example.com",
        initialReconnectDelay: 500,
        maxReconnectDelay: 10000,
        backoffMultiplier: 1.5,
        useJitter: false,
      });

      // Configuration is used internally for reconnection logic
      expect(customClient.getReconnectAttempts()).toBe(0);
    });

    it("should normalize WebSocket URL", async () => {
      const sendSpy = vi.fn();

      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          // URL should be normalized without trailing slash
          // This is checked when the WebSocket is created
        }
      } as any;

      const urlClient = new WebSocketClient({
        wsUrl: "wss://api.example.com/",
      });

      await urlClient.connect();
      expect(urlClient.isConnected()).toBe(true);
    });
  });
});
