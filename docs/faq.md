# Frequently Asked Questions (FAQ)

## General Questions

### What is SoroScan?

SoroScan is an event indexer for the Soroban smart contract platform on the Stellar blockchain. it provides a high-level
API and dashboard for developers to track and analyze contract interactions.

### Is SoroScan open source?

Yes! SoroScan is fully open source and can be self-hosted. You can find our repositories on
[GitHub](https://github.com/Harbduls/soroscan).

---

## Technical Questions

### How do I get an API Key?

If you are using the public instance at `soroscan.io`, you can generate an API key from your
[Account Settings](https://soroscan.io/settings/api-keys). If you are self-hosting, you can generate keys via the Django
Admin interface.

### What is the difference between REST and GraphQL?

- **REST**: Best for simple lookups, CRUD operations on contracts or webhooks, and predictable data structures.
- **GraphQL**: Best for complex queries where you need to fetch multiple related resources (e.g., a contract and its
  last 10 events) in a single request.

### My webhook is not receiving events. What should I check?

1. **Endpoint Status**: Ensure your webhook URL is public and returns a `200 OK`.
1. **Triggers**: Verify that you've subscribed to the correct triggers (e.g., `event.created`).
1. **Logs**: Check the Webhook Delivery Logs in the SoroScan Dashboard to see the specific error code returned by your
   server.
1. **Firewall**: Ensure your server allows incoming requests from the SoroScan IP range (if using the public instance).

---

## Troubleshooting

### I am getting a `429 Too Many Requests` error.

This means you have exceeded the rate limit for your IP or API key. Authenticated users have higher limits. If you need
a custom increase, please contact us.

### The SDK is throwing a `ValidationError`.

This usually happens when the API returns a response that doesn't match the expected schema, or when you pass invalid
parameters to a local method. Ensure you are using the latest version of the SDK.

### I can't find events for a newly deployed contract.

It may take a few seconds for SoroScan to start indexing a new contract. If events are still missing after a minute,
ensure that the contract is emitting events correctly on-chain.
