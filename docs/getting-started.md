# Getting Started

Welcome to **SoroScan**, the high-performance event indexer and explorer for the Soroban smart contract platform on Stellar.

## Introduction

SoroScan provides developers with a robust set of tools to index, query, and monitor smart contract events in real-time. Whether you are building a DeFi dashboard, a gaming platform, or a supply chain tracker, SoroScan simplifies the process of accessing on-chain data.

## Key Features

- **Real-Time Indexing**: Low-latency event capture from the Soroban network.
- **Unified API**: Access data via REST or GraphQL.
- **Webhooks**: Get notified instantly when specific events occur.
- **Multi-SDK Support**: Official libraries for Python and TypeScript/JavaScript.

## Quick Setup

### 1. Install an SDK

Choose the SDK that fits your tech stack:

#### Python
```bash
pip install soroscan-sdk
```

#### TypeScript / JavaScript
```bash
npm install @soroscan/sdk
```

### 2. Basic Usage Example (TypeScript)

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({
  baseUrl: "https://api.soroscan.io",
  apiKey: "your-api-key",
});

// Fetch events
const events = await client.getEvents({
  contractId: "CCAAA...",
  first: 10,
});

console.log(events.items);
```

## Next Steps

- Explore the [API Overview](./api-overview.md) to understand the endpoint structure.
- Check out the [Python SDK Guide](./sdk-python.md) or [TypeScript SDK Guide](./sdk-typescript.md) for more details.
- Learn how the SDKs are built and released in the [SDK Development Guide](./contributing/sdk-development.md).
- Integrate your own contracts with the [Soroban Contract Integration Guide](./cookbook/soroban-contract-integration.md).
- Learn how to [Deploy](./deployment/docker-compose.md) your own SoroScan instance.
