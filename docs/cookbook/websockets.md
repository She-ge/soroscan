# WebSocket Real-Time Event Streaming Tutorial

WebSockets provide low-latency, bidirectional communication for real-time contract event streaming. Instead of polling the SoroScan API or waiting for webhook deliveries, you can establish a persistent connection to receive contract events instantly as they occur on the Stellar blockchain.

---

## 🚀 Quick Start

SoroScan offers two WebSocket endpoint types:
1. **Direct WebSocket API**: Simple event streaming for specific contracts (`ws://api.soroscan.io/ws/events/<contract_id>/`)
2. **GraphQL Subscriptions**: Rich query capabilities over WebSocket (`wss://api.soroscan.io/graphql/`)

---

## 🛠️ Method 1: Direct WebSocket Connection

The simplest way to stream contract events is using the direct WebSocket endpoint.

### Endpoint Format
```
ws://api.soroscan.io/ws/events/<CONTRACT_ID>/
```

**Optional Query Parameters:**
- `event_type`: Filter events by type (e.g., `?event_type=transfer`)

### JavaScript Connection Example
```javascript
// Connect to a specific contract's event stream
const contractId = "CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const ws = new WebSocket(`ws://api.soroscan.io/ws/events/${contractId}/`);

// Optional: Filter by event type
// const ws = new WebSocket(`ws://api.soroscan.io/ws/events/${contractId}/?event_type=transfer`);

ws.onopen = function(event) {
    console.log('WebSocket connected to contract:', contractId);
};

ws.onmessage = function(event) {
    const eventData = JSON.parse(event.data);
    console.log('New contract event:', eventData);
    
    // Process the event
    handleContractEvent(eventData);
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};

ws.onclose = function(event) {
    console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason);
    
    // Implement reconnection logic
    if (event.code !== 1000) { // Not a normal closure
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket(); // Your connection function
        }, 5000);
    }
};

function handleContractEvent(event) {
    console.log(`Event Type: ${event.event_type}`);
    console.log(`Ledger: ${event.ledger}`);
    console.log(`Transaction Hash: ${event.tx_hash}`);
    console.log(`Payload:`, event.payload);
    console.log(`Timestamp: ${event.timestamp}`);
    
    // Your business logic here
    switch(event.event_type) {
        case 'transfer':
            handleTransferEvent(event);
            break;
        case 'mint':
            handleMintEvent(event);
            break;
        default:
            console.log('Unknown event type:', event.event_type);
    }
}
```

### Event Message Structure
Each WebSocket message contains a JSON object with the following fields:

```json
{
    "id": 12345,
    "event_type": "transfer",
    "payload": {
        "from": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "to": "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
        "amount": "1000000000"
    },
    "decoded_payload": {
        "from": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", 
        "to": "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
        "amount": 1000000000
    },
    "ledger": 98765,
    "event_index": 0,
    "timestamp": "2026-08-27T14:30:45.123456Z",
    "tx_hash": "abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "contract_id": "CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "contract_name": "My Token Contract",
    "schema_version": "1.0",
    "validation_status": "valid",
    "signature_status": "valid"
}
```

### Connection Status Codes
- **1000**: Normal closure
- **4004**: Contract not found or inactive
- **4429**: Rate limit exceeded (too many concurrent connections)

---

## 🔥 Method 2: GraphQL Subscriptions

For advanced use cases requiring complex filtering or multiple contract monitoring, use GraphQL subscriptions.

### WebSocket Subprotocol
GraphQL subscriptions use the `graphql-transport-ws` subprotocol. Most GraphQL clients support this automatically.

### JavaScript with graphql-ws
```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
    url: 'wss://api.soroscan.io/graphql/',
    connectionParams: {
        // Optional: Include authentication headers
        authorization: 'Bearer your_jwt_token_here',
    },
});

// Subscribe to contract events
const contractEventsSubscription = `
    subscription ContractEvents($contractId: String!) {
        contractEvents(contractId: $contractId) {
            id
            eventType
            payload
            decodedPayload
            ledger
            timestamp
            txHash
            contract {
                contractId
                name
            }
        }
    }
`;

const unsubscribe = client.subscribe(
    {
        query: contractEventsSubscription,
        variables: { contractId: "CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }
    },
    {
        next: (data) => {
            console.log('GraphQL subscription event:', data.data.contractEvents);
        },
        error: (err) => {
            console.error('Subscription error:', err);
        },
        complete: () => {
            console.log('Subscription completed');
        },
    }
);

// Stop the subscription when needed
// unsubscribe();
```

### Notifications Subscription
Subscribe to system notifications and alerts:

```javascript
const notificationsSubscription = `
    subscription Notifications {
        notifications {
            id
            notificationType
            title
            message
            isRead
            createdAt
        }
    }
`;

client.subscribe(
    {
        query: notificationsSubscription,
        variables: {}
    },
    {
        next: (data) => {
            const notification = data.data.notifications;
            showNotificationInUI(notification);
        },
        error: (err) => console.error('Notifications error:', err),
    }
);
```

---

## 🔄 Handling Reconnections and Heartbeats

### Automatic Reconnection Pattern
```javascript
class SoroScanWebSocket {
    constructor(contractId, options = {}) {
        this.contractId = contractId;
        this.url = `ws://api.soroscan.io/ws/events/${contractId}/`;
        this.options = {
            maxReconnectAttempts: 10,
            reconnectInterval: 5000,
            heartbeatInterval: 30000,
            ...options
        };
        
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.isReconnecting = false;
        
        this.connect();
    }
    
    connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventHandlers();
            this.startHeartbeat();
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    setupEventHandlers() {
        this.ws.onopen = (event) => {
            console.log(`Connected to contract ${this.contractId}`);
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            
            // Notify your application
            this.onConnected?.(event);
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Handle heartbeat/ping responses
            if (data.type === 'pong') {
                console.log('Received heartbeat response');
                return;
            }
            
            // Process contract events
            this.onMessage?.(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.onError?.(error);
        };
        
        this.ws.onclose = (event) => {
            console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
            this.stopHeartbeat();
            
            // Don't reconnect on normal closure or client-initiated close
            if (event.code === 1000 || event.code === 1001) {
                return;
            }
            
            // Handle error cases
            if (event.code === 4004) {
                console.error('Contract not found or inactive');
                return;
            }
            
            if (event.code === 4429) {
                console.error('Rate limited - too many connections');
                // Wait longer before retry
                setTimeout(() => this.scheduleReconnect(), 60000);
                return;
            }
            
            this.scheduleReconnect();
        };
    }
    
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                // Send ping to keep connection alive
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, this.options.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    scheduleReconnect() {
        if (this.isReconnecting) return;
        
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            this.onMaxReconnectAttemptsReached?.();
            return;
        }
        
        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        const delay = Math.min(
            this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            30000 // Max 30 second delay
        );
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    close() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
        }
    }
    
    // Callback methods - override these
    onConnected(event) {}
    onMessage(data) {}
    onError(error) {}
    onMaxReconnectAttemptsReached() {}
}

// Usage Example
const contractWS = new SoroScanWebSocket('CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

contractWS.onMessage = (event) => {
    console.log('Contract event received:', event);
    // Your event handling logic
};

contractWS.onError = (error) => {
    console.error('Connection error:', error);
    // Handle connection errors
};

contractWS.onMaxReconnectAttemptsReached = () => {
    console.error('Unable to maintain connection to SoroScan');
    // Show user notification or fallback to polling
};

// Close connection when done
// contractWS.close();
```

### Node.js WebSocket Client
```javascript
const WebSocket = require('ws');

class NodeSoroScanClient {
    constructor(contractId) {
        this.contractId = contractId;
        this.url = `ws://api.soroscan.io/ws/events/${contractId}/`;
        this.reconnectDelay = 5000;
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.on('open', () => {
            console.log(`Connected to SoroScan for contract: ${this.contractId}`);
        });
        
        this.ws.on('message', (data) => {
            const event = JSON.parse(data.toString());
            this.handleEvent(event);
        });
        
        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        
        this.ws.on('close', (code, reason) => {
            console.log(`Connection closed: ${code} - ${reason}`);
            
            if (code !== 1000) {
                console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
                setTimeout(() => this.connect(), this.reconnectDelay);
            }
        });
    }
    
    handleEvent(event) {
        console.log(`New ${event.event_type} event on ledger ${event.ledger}`);
        console.log('Payload:', event.payload);
        
        // Process the event in your application
        // e.g., update database, send notifications, etc.
    }
    
    close() {
        if (this.ws) {
            this.ws.close(1000);
        }
    }
}

// Usage
const client = new NodeSoroScanClient('CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    client.close();
    process.exit(0);
});
```

---

## 🔧 Rate Limiting and Connection Limits

### Connection Limits
- **Maximum concurrent connections per IP**: 50
- **Maximum concurrent connections per contract**: 100
- **GraphQL subscriptions per authenticated user**: 25

### Rate Limiting Response
If you exceed connection limits, the WebSocket will close with code `4429`:

```javascript
ws.onclose = function(event) {
    if (event.code === 4429) {
        console.error('Rate limited - reduce concurrent connections');
        // Implement exponential backoff
        setTimeout(reconnect, 60000); // Wait 1 minute before retry
    }
};
```

---

## 🛠️ Testing Your WebSocket Integration

### 1. Test Connection
```javascript
// Simple connection test
function testConnection(contractId) {
    const ws = new WebSocket(`ws://api.soroscan.io/ws/events/${contractId}/`);
    
    ws.onopen = () => console.log('✅ Connection successful');
    ws.onmessage = (event) => console.log('📨 Message received:', event.data);
    ws.onerror = (error) => console.error('❌ Error:', error);
    ws.onclose = (event) => console.log(`🔌 Closed: ${event.code} - ${event.reason}`);
    
    // Close after 10 seconds
    setTimeout(() => ws.close(), 10000);
}

// Test with a known active contract
testConnection('CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
```

### 2. Monitor Connection Health
```javascript
function monitorConnection(ws) {
    let lastMessageTime = Date.now();
    
    ws.onmessage = (event) => {
        lastMessageTime = Date.now();
        // Process message...
    };
    
    // Check for stale connection every 60 seconds
    setInterval(() => {
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        
        if (timeSinceLastMessage > 120000) { // 2 minutes
            console.warn('Connection may be stale - no messages in 2 minutes');
        }
    }, 60000);
}
```

---

## 🔍 Troubleshooting

### Common Connection Issues

| Code | Issue | Solution |
|------|-------|----------|
| 4004 | Contract not found | Verify the contract ID exists and is active |
| 4429 | Rate limited | Reduce concurrent connections, implement backoff |
| 1006 | Abnormal closure | Network issue, implement reconnection logic |
| 1011 | Server error | SoroScan service issue, check status page |

### Debug Connection Problems
```javascript
// Enable detailed WebSocket logging
const ws = new WebSocket('ws://api.soroscan.io/ws/events/YOUR_CONTRACT_ID/');

ws.addEventListener('open', (event) => {
    console.log('🟢 WebSocket opened:', event);
});

ws.addEventListener('message', (event) => {
    console.log('📥 Message received:', {
        data: event.data,
        timestamp: new Date().toISOString()
    });
});

ws.addEventListener('error', (event) => {
    console.error('🔴 WebSocket error:', {
        error: event.error,
        message: event.message,
        type: event.type
    });
});

ws.addEventListener('close', (event) => {
    console.log('🔌 WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
    });
});
```

### Network Connectivity Test
```javascript
// Test if SoroScan WebSocket endpoint is reachable
async function testEndpoint() {
    try {
        const response = await fetch('https://api.soroscan.io/health/');
        if (response.ok) {
            console.log('✅ SoroScan API is reachable');
        } else {
            console.warn('⚠️ SoroScan API returned:', response.status);
        }
    } catch (error) {
        console.error('❌ Cannot reach SoroScan API:', error.message);
    }
}
```

---

## 📚 Next Steps

- **Monitor Multiple Contracts**: Use GraphQL subscriptions to efficiently track events across multiple contracts
- **Event Filtering**: Implement client-side filtering for specific event patterns
- **Error Handling**: Build robust error handling for production environments  
- **Security**: Implement authentication for private contract monitoring
- **Performance**: Use connection pooling for high-throughput applications

For more advanced use cases, see:
- [GraphQL Advanced Queries](./graphql-advanced-queries.md)
- [Monitor Contract Activity](./monitor-contract-activity.md)
- [Webhook Integration](./webhooks.md)