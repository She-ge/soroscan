# ADR 0002: GraphQL vs REST API Tradeoffs

## Status
Accepted

## Context
SoroScan serves a wide variety of developers. Some need simple, paginated lists of events for a specific contract. Others need highly specific, deeply nested queries (e.g., fetching a transaction, its associated events, and the webhook dispatch status in a single request) and real-time subscription capabilities.

## Decision
We decided to implement and expose **both** REST and GraphQL APIs.
* **REST (Django Rest Framework):** Provided for standard CRUD operations, simple event fetching, and integrations using standard tooling (e.g., Zapier, cURL).
* **GraphQL (Strawberry):** Provided for complex data fetching, preventing over-fetching/under-fetching, and handling real-time WebSockets via GraphQL Subscriptions.

## Consequences
**Positive:**
* **Developer Experience:** We cater to all developer preferences. Frontend developers (Next.js) heavily benefit from Apollo Client and GraphQL, while backend scripts benefit from simple REST endpoints.
* **Real-time:** GraphQL Subscriptions provide a standardized, typed way to push events to web clients without inventing a custom WebSocket protocol.

**Negative:**
* **Maintenance Burden:** We have to maintain two API schemas. Changes to the core database models must be mapped to both DRF Serializers and Strawberry Types.
* **Security Complexity:** GraphQL requires careful configuration to prevent deeply nested queries from causing Denial of Service (DoS) attacks on the database.
