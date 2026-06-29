---
slug: /deployment/costs

title: Cost Estimates & Optimization
description: Cost guidance for different deployment sizes and optimization tips.
sidebar_label: Cost Estimates
hide_title: false
---

Example monthly cost estimates (approximate) for small/medium production deployments.

## Small (low traffic)
- 3 x t3.medium EKS nodes: $120
- RDS db.t3.medium (100GB): $120
- ElastiCache small: $40
- ALB, NAT, Transfer: $50
- Total: ~$330/month

## Medium (moderate traffic)
- 5 x t3.large: $300
- RDS db.m5.large (200GB): $300
- ElastiCache cluster: $150
- ALB, Transfer: $100
- Total: ~$850/month

## Optimization tips
- Use spot instances for non-critical worker pools.
- Right-size RDS storage and use autoscaling IO where supported.
- Use autoscaling groups and HPA to reduce idle costs.
- Implement caching and CDN for frontend assets.
