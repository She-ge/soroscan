---
slug: /deployment/helm

title: Helm Chart
description: Install and configure the SoroScan Helm chart.
sidebar_label: Helm Chart
hide_title: false
---

The Helm chart in [`helm-chart/`](https://github.com/SoroScan/soroscan/tree/main/helm-chart) packages the SoroScan
backend, Celery workers and beat scheduler, services, ingress, configuration,
backup CronJob, and optional autoscaling/monitoring resources.

## Install

Run these commands from the repository root. Replace the image repositories and
secret values in [`values-production.yaml`](./values-production.yaml) before
installing.

```bash
helm upgrade --install soroscan ./helm-chart \
  --namespace soroscan \
  --create-namespace \
  -f docs/deployment/helm/values-production.yaml
```

To use an externally managed Secret instead of letting the chart create one, set
`secrets.create=false` and `secrets.existingSecret=<secret-name>`. The Secret
must provide the same keys the application reads, including `SECRET_KEY`,
`DATABASE_URL`, `REDIS_URL`, `SOROSCAN_CONTRACT_ID`, and `INDEXER_SECRET_KEY`.

## Validate the chart

```bash
helm lint ./helm-chart
helm template soroscan ./helm-chart \
  --namespace soroscan \
  -f docs/deployment/helm/values-production.yaml
```

## Common overrides

| Value | Description |
|-------|-------------|
| `replicaCount` | Backend replicas (ignored when `autoscaling.enabled=true`). |
| `image.repository`, `image.tag` | Backend and worker image. |
| `config` | Non-sensitive environment variables rendered into a ConfigMap. |
| `secrets.data` | Secret values written to the chart-managed Secret. |
| `celery.workers.<name>` | Per-queue worker replicas, concurrency, and resources. |
| `celery.beat.enabled` | Run the single Celery beat scheduler. |
| `backup.enabled` | Deploy the PostgreSQL backup CronJob and ConfigMap. |
| `autoscaling.enabled` | Deploy a HorizontalPodAutoscaler for the backend. |
| `podDisruptionBudget.enabled` | Deploy a PodDisruptionBudget for the backend. |
| `serviceMonitor.enabled` | Deploy a Prometheus Operator ServiceMonitor. |

The chart uses the release name as the resource prefix. Installing with
`--name soroscan` produces resources such as `soroscan-backend`,
`soroscan-worker-high`, `soroscan-beat`, and `soroscan-pg-backup`.
