---
slug: /deployment/overview

title: Production Deployment & Operations Guide
description: How to deploy, monitor, and operate SoroScan in production.
sidebar_label: Deployment & Ops
hide_title: false
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

## SoroScan Production Deployment & Operations

This guide covers recommended production deployments for SoroScan, including local Docker Compose, Kubernetes (Helm +
Terraform), an AWS/EKS example, monitoring, backups, security, runbooks, and troubleshooting.

**Quick links**
- [Docker Compose](./docker-compose.md)
- [Kubernetes (Helm)](./kubernetes.md)
- [AWS EKS (Terraform)](./aws.md)
- [Monitoring & Observability](./monitoring.md)
- [Backups & Disaster Recovery](./backups.md)
- [Troubleshooting & Runbooks](./runbooks.md)
- [Pre-Deployment Security Checklist](./security.md)
- [Cost Estimates](./costs.md)

## Decision tree

Use this short decision tree to pick a deployment path:

- Small development/staging: Docker Compose
- Production, multi-tenant, high availability: Kubernetes on cloud (EKS, GKE, AKS)
- Single-tenant or low-ops: Managed PaaS (Heroku/DO App Platform) — see AWS section for guidance

## Architecture (high level)

```mermaid
flowchart LR
  subgraph OnChain
    SORO["Soroban Contracts / Stellar Horizon"]
  end
  subgraph Ingest
    NODE["Ingest Workers"]
    CELERY["Celery (task queue)"]
    REDIS["Redis (cache & broker)"]
  end
  subgraph API
    DJANGO["Django + DRF + Strawberry GraphQL"]
    ASGI["ASGI (WebSockets/Subscriptions)"]
    PG["PostgreSQL"]
  end
  SORO --> NODE --> CELERY --> PG
  NODE --> REDIS
  DJANGO --> PG
  DJANGO --> REDIS
  DJANGO --> ASGI
  CELERY --> REDIS
```

## Notes and scope

- These docs provide examples and operational guidance. Adapt resource sizes and retention policies to your workload and
  compliance needs.
- Files included: sample Helm values, a Terraform EKS snippet, and a Postgres backup example.
