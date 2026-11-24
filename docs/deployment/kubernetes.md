# Deployment: Kubernetes (K8s)

For scalable production environments, SoroScan includes a full set of **Kubernetes** manifests. This configuration
supports high availability, ingress management, and automated monitoring.

## Prerequisites

- A running Kubernetes cluster (v1.22+)
- `kubectl` configured to access your cluster
- `helm` (optional, for some configurations)

## Deployment Steps

All Kubernetes manifests are located in the `k8s/` directory.

### 1. Namespace and Secrets

Create the core namespace and apply basic configurations:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret-reference.yaml
```

### 2. Database and Redis

Deploy the stateful components (if not using managed cloud services):

```bash
kubectl apply -f k8s/service.yaml
```

### 3. Backend Services

Deploy the Django API and Celery workers:

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/beat-cronjob.yaml
```

### 4. Networking

Apply the ingress and external service definitions:

```bash
kubectl apply -f k8s/ingress.yaml
```

## Monitoring and Maintenance

### Scaling Workers

```bash
kubectl scale deployment soroscan-worker --replicas=5
```

### Backup and Restore

Use the provided CronJobs for automated database backups:

```bash
kubectl apply -f k8s/backup-cronjob.yaml
```

### Monitoring with Grafana

Import the dashboard provided in `k8s/grafana-dashboard.json` into your Grafana instance to monitor real-time metrics.

## Troubleshooting

- **CrashLoopBackOff**: Check the logs for migration failures or missing environment secrets.

  ```bash
  kubectl logs deployment/soroscan-backend
  ```

- **Ingress Issues**: Ensure your cluster has an Ingress Controller (like Nginx) installed and configured correctly.
- **Service Discovery**: Verify that internal service names in `backend-deployment.yaml` match your `db` and `redis`
  services.
