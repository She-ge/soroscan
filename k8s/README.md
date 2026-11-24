# Kubernetes manifests

These manifests deploy the SoroScan API, Celery workers and beat scheduler,
service routing, backups, and optional monitoring resources. The API and worker
deployments expect external PostgreSQL and Redis services; this directory does
not provision either database.

## Prerequisites

- A Kubernetes cluster with `kubectl` access.
- Reachable PostgreSQL and Redis instances, and an image registry containing
  `soroscan/backend:v1.0.0` and `soroscan/pg-backup:latest` (adjust image names
  and tags for your deployment).
- A `soroscan` namespace and the `soroscan-config` ConfigMap.
- A `soroscan-secrets` Secret with the Django, database, Redis, and indexer
  values required by the application. Create it directly, or install the
  External Secrets Operator and configure the `SecretStore` referenced by
  `secret-reference.yaml` before applying that resource.
- For `servicemonitor.yaml` and `prometheus-rules.yaml`, install the Prometheus
  Operator and its `ServiceMonitor` and `PrometheusRule` CRDs. Configure its
  selectors to include the manifests' `prometheus: kube-prometheus` label.
- For `ingress.yaml`, install an ingress controller and create any referenced
  TLS Secret. Backup jobs additionally require appropriate object-storage
  credentials and a configured bucket.

## Apply order

Run commands from the repository root. Change the namespace, image references,
storage settings, and hostnames to match your environment before applying.

1. Install prerequisite operators and CRDs, configure external PostgreSQL and
   Redis, and prepare the image registry and credentials.
1. Create the namespace:

   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

1. Create the application configuration and credentials. Apply
   `configmap.yaml`; create the `soroscan-secrets` Secret directly or apply
   `secret-reference.yaml` after configuring its `SecretStore`. If using
   backups, also apply `backup-configmap.yaml` and provide the required storage
   credentials.
1. Apply the application workloads and their services:

   ```bash
   kubectl apply -f k8s/serviceaccount.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/worker-deployment.yaml
   kubectl apply -f k8s/beat-cronjob.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/worker-metrics-service.yaml
   kubectl apply -f k8s/hpa.yaml
   ```

   `hpa.yaml` requires [metrics-server](https://github.com/kubernetes-sigs/metrics-server).
   The backend and worker deployments do not set `spec.replicas`; their
   HorizontalPodAutoscalers own the replica count. All scale on average CPU
   utilization relative to each container's CPU request:

   | Deployment | Min | Max | CPU target |
   | --- | --- | --- | --- |
   | `soroscan-backend` | 2 | 10 | 70% |
   | `soroscan-worker-high` | 1 | 8 | 75% |
   | `soroscan-worker-default` | 1 | 6 | 75% |
   | `soroscan-worker-low` | 1 | 4 | 75% |
   | `soroscan-worker-backfill` | 1 | 3 | 75% |

1. Apply `ingress.yaml` after configuring its hostname, ingress class, and TLS
   Secret.
1. Apply `backup-cronjob.yaml` only after configuring the backup image, bucket,
   credentials, and `backup-configmap.yaml`.
1. Apply `servicemonitor.yaml` and `prometheus-rules.yaml` after the Prometheus
   Operator CRDs and selector labels are in place.
1. Import `grafana-dashboard.json` into Grafana separately. Files in
   `grafana-templates/` are dashboard templates, not Kubernetes resources.

## Manifest inventory

| File | Purpose |
| --- | --- |
| `namespace.yaml` | Creates the `soroscan` namespace. |
| `configmap.yaml` | Non-secret Django, RPC, and Celery configuration. |
| `secret-reference.yaml` | Optional External Secrets Operator resource that creates `soroscan-secrets`. |
| `serviceaccount.yaml` | Dedicated `soroscan` ServiceAccount used by the backend, worker, and beat pods, with API token automounting disabled. |
| `backend-deployment.yaml` | Django API deployment, including migrations, static collection, and HTTP probes. |
| `service.yaml` | ClusterIP service routing API traffic to backend pods. |
| `worker-deployment.yaml` | High-, default-, low-priority, and backfill Celery worker deployments; exposes prefork-safe Prometheus metrics on port 9100. |
| `worker-metrics-service.yaml` | ClusterIP service routing Prometheus scrapes to worker pods. |
| `hpa.yaml` | CPU-based HorizontalPodAutoscalers for the backend and each worker deployment. |
| `beat-cronjob.yaml` | Single-replica Celery beat scheduler deployment. |
| `ingress.yaml` | External HTTP routing to the backend service. |
| `backup-configmap.yaml` | Object-storage bucket, prefixes, and retention settings for backups. |
| `backup-cronjob.yaml` | Scheduled PostgreSQL backup job. |
| `servicemonitor.yaml` | Prometheus Operator scrape configuration for backend and worker metrics. |
| `prometheus-rules.yaml` | Prometheus Operator alert rules, including Celery queue and task-failure alerts. |
| `grafana-dashboard.json` | Grafana dashboard definition to import separately. |
| `grafana-templates/` | Grafana dashboard templates; not applied with `kubectl`. |
