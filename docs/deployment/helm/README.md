---
slug: /deployment/helm

title: Helm Chart Example
description: Sample Helm chart values and guidance for deploying SoroScan.
sidebar_label: Helm Chart
hide_title: false
---

This folder contains a minimal `values.yaml` example for deploying SoroScan via Helm.

Usage:

```bash
helm upgrade --install soroscan ./helm-chart -n soroscan -f values-production.yaml
```

Customize replicas, resources, and secrets per environment.
