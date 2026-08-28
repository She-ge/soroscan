# SoroScan Deployment Runbook

This runbook covers the supported deployment paths for the SoroScan stack:

1. local development with Docker Compose;
2. production-style deployment with the repository's Kubernetes manifests;
3. Helm-based deployment when a compatible chart is available.

Use this document as the operational checklist for deployment, verification, and rollback.

## Repository deployment assets

- `docker-compose.yml` — local PostgreSQL, Redis, Django, Celery, and frontend stack.
- `k8s/` — namespace, application deployments, service, ingress, monitoring, and backup manifests.
- `docs/deployment/helm/values-production.yaml` — production-oriented Helm values example.
- `docs/deployment/docker-compose.md` — additional Docker Compose notes.
- `docs/deployment/kubernetes.md` — additional Kubernetes notes.

---

# 1. Docker Compose

## 1.1 Prerequisites

Install:

- Docker Engine 20.10+ or Docker Desktop;
- Docker Compose v2 (`docker compose`);
- Git.

Run commands from the repository root unless a step says otherwise.

## 1.2 Configure the environment

Create the backend environment file from the checked-in example:

```bash
cp django-backend/.env.example django-backend/.env
```

Review `django-backend/.env` and set any environment-specific values required for your workflow.

The Compose file overrides the local database and Redis URLs so the application can reach the `db` and `redis` services on the internal Compose network.

Do not commit `django-backend/.env`.

## 1.3 Validate the Compose configuration

Render and validate the final Compose configuration before starting containers:

```bash
docker compose config
```

If this command reports a missing environment variable or invalid configuration, resolve it before continuing.

## 1.4 Build and start the stack

```bash
docker compose up -d --build
```

The default stack starts:

- `db` — PostgreSQL 15;
- `redis` — Redis 7;
- `web` — Django API;
- `worker-high` — high-priority Celery queue;
- `worker-default` — default Celery queue;
- `worker-low` — low-priority Celery queue;
- `worker-backfill` — backfill Celery queue;
- `beat` — Celery Beat scheduler;
- `frontend` — SoroScan frontend.

The `webhook-simulator` service is behind the optional `tools` profile and is not started by the default command.

## 1.5 Verify container health

Check container state:

```bash
docker compose ps
```

Healthy dependencies should report as running/healthy, and the application containers should remain in a running state.

Inspect startup logs when a service does not remain running:

```bash
docker compose logs --tail=200 web
docker compose logs --tail=200 worker-default
docker compose logs --tail=200 beat
```

## 1.6 Verify the backend and frontend

The default backend port is `8000` and the frontend port is `3000`.

Verify the API:

```bash
curl -fsS http://localhost:8000/api/events/
```

Verify the frontend by opening:

```text
http://localhost:3000
```

If `WEB_PORT` is overridden in your shell or environment file, use that port instead of `8000`.

## 1.7 Common operational commands

Follow backend logs:

```bash
docker compose logs -f web
```

Follow all worker logs:

```bash
docker compose logs -f worker-high worker-default worker-low worker-backfill
```

Run migrations manually:

```bash
docker compose exec web python manage.py migrate
```

Create a Django superuser:

```bash
docker compose exec web python manage.py createsuperuser
```

Stop containers without deleting the database volume:

```bash
docker compose down
```

Stop containers and remove the local PostgreSQL volume:

```bash
docker compose down -v
```

Use `-v` only when intentionally discarding local data.

## 1.8 Docker Compose rollback

Before a deployment, record the current revision:

```bash
git rev-parse --short HEAD
```

To roll back application code:

```bash
docker compose down
git switch --detach <known-good-tag-or-commit>
docker compose up -d --build
docker compose ps
curl -fsS http://localhost:8000/api/events/
```

After verification, return to your normal branch when appropriate:

```bash
git switch <branch-name>
```

`docker compose down` preserves named volumes by default, so the PostgreSQL data volume remains in place. Database schema changes require extra care: do not assume application-code rollback also reverses migrations. Back up important data before applying migrations and use migration-specific rollback procedures only when the migration is designed to be reversible.

---

# 2. Kubernetes with `kubectl apply`

The repository includes Kubernetes manifests in `k8s/`. The manifests use the `soroscan` namespace and expect a Secret named `soroscan-secrets`.

## 2.1 Prerequisites

Prepare:

- Kubernetes 1.22+;
- `kubectl` configured for the target cluster;
- a PostgreSQL database reachable from the cluster;
- a Redis instance reachable from the cluster;
- a SoroScan backend image available to the cluster;
- an ingress controller if `k8s/ingress.yaml` will be used.

Confirm cluster access:

```bash
kubectl cluster-info
kubectl get nodes
```

## 2.2 Set the application image

Before applying the workload manifests, replace the example image:

```text
soroscan/backend:v1.0.0
```

with the registry/repository/tag you intend to deploy in:

- `k8s/backend-deployment.yaml`;
- `k8s/worker-deployment.yaml`;
- `k8s/beat-cronjob.yaml`.

The backend manifest uses the image in both init containers and the main backend container, so all occurrences must point to the same intended release unless your deployment strategy explicitly requires otherwise.

## 2.3 Create the namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

Verify:

```bash
kubectl get namespace soroscan
```

## 2.4 Create application secrets

### Option A: standard Kubernetes Secret

Use this path when External Secrets Operator is not configured:

```bash
kubectl create secret generic soroscan-secrets   --from-literal=SECRET_KEY='<django-secret-key>'   --from-literal=DATABASE_URL='<postgresql-connection-url>'   --from-literal=REDIS_URL='<redis-connection-url>'   --from-literal=SOROSCAN_CONTRACT_ID='<contract-id>'   --from-literal=INDEXER_SECRET_KEY='<indexer-secret-key>'   -n soroscan
```

Confirm that the Secret exists without printing secret values:

```bash
kubectl get secret soroscan-secrets -n soroscan
```

### Option B: External Secrets Operator

`k8s/secret-reference.yaml` is an `ExternalSecret` example. Apply it only after:

1. External Secrets Operator is installed;
2. the referenced `SecretStore` exists;
3. the referenced remote secrets exist.

Then apply:

```bash
kubectl apply -f k8s/secret-reference.yaml
```

Do not apply this manifest to a cluster that does not have the External Secrets CRDs installed.

## 2.5 Apply application configuration

Review `k8s/configmap.yaml` first, especially:

- `ALLOWED_HOSTS`;
- `FRONTEND_BASE_URL`;
- `SOROBAN_RPC_URL`;
- `STELLAR_NETWORK_PASSPHRASE`;
- `CORS_ALLOWED_ORIGINS`.

Apply it:

```bash
kubectl apply -f k8s/configmap.yaml
```

Verify:

```bash
kubectl get configmap soroscan-config -n soroscan
```

## 2.6 Apply the backend service

```bash
kubectl apply -f k8s/service.yaml
```

Verify:

```bash
kubectl get service soroscan-backend -n soroscan
```

## 2.7 Deploy the backend

```bash
kubectl apply -f k8s/backend-deployment.yaml
```

Wait for rollout:

```bash
kubectl rollout status deployment/soroscan-backend -n soroscan
```

The backend deployment runs migrations and static-file collection in init containers before starting the Gunicorn container.

## 2.8 Deploy Celery workers

```bash
kubectl apply -f k8s/worker-deployment.yaml
```

Wait for each worker deployment:

```bash
kubectl rollout status deployment/soroscan-worker-high -n soroscan
kubectl rollout status deployment/soroscan-worker-default -n soroscan
kubectl rollout status deployment/soroscan-worker-low -n soroscan
kubectl rollout status deployment/soroscan-worker-backfill -n soroscan
```

## 2.9 Deploy Celery Beat

```bash
kubectl apply -f k8s/beat-cronjob.yaml
```

Verify the single-replica Beat deployment:

```bash
kubectl rollout status deployment/soroscan-beat -n soroscan
```

Only one Beat replica should run to avoid duplicate scheduled-task dispatch.

## 2.10 Apply ingress

Review the ingress class, hostname, TLS configuration, and controller-specific annotations in `k8s/ingress.yaml`.

Then apply:

```bash
kubectl apply -f k8s/ingress.yaml
```

Verify:

```bash
kubectl get ingress -n soroscan
```

## 2.11 Optional monitoring and backup resources

Apply only the resources supported by your cluster:

```bash
kubectl apply -f k8s/servicemonitor.yaml
kubectl apply -f k8s/prometheus-rules.yaml
kubectl apply -f k8s/backup-configmap.yaml
kubectl apply -f k8s/backup-cronjob.yaml
```

For monitoring guidance, see `docs/deployment/monitoring.md`. For backup guidance, see `docs/deployment/backups.md`.

---

# 3. Kubernetes health verification

## 3.1 Check workload state

```bash
kubectl get pods -n soroscan
kubectl get deployments -n soroscan
kubectl get service -n soroscan
kubectl get ingress -n soroscan
```

All expected deployment replicas should become `Ready`.

## 3.2 Inspect backend events and logs

```bash
kubectl describe deployment/soroscan-backend -n soroscan
kubectl logs deployment/soroscan-backend -n soroscan --tail=200
```

If an init container fails, inspect it directly:

```bash
kubectl get pods -n soroscan
kubectl logs <backend-pod-name> -n soroscan -c migrate
kubectl logs <backend-pod-name> -n soroscan -c collectstatic
```

## 3.3 Verify the service locally through port-forwarding

In one terminal:

```bash
kubectl port-forward service/soroscan-backend 8000:80 -n soroscan
```

In another terminal:

```bash
curl -fsS http://127.0.0.1:8000/api/events/
```

A successful response confirms that the backend pod, service selector, and HTTP path are working together.

## 3.4 Verify worker logs

```bash
kubectl logs deployment/soroscan-worker-default -n soroscan --tail=100
kubectl logs deployment/soroscan-worker-high -n soroscan --tail=100
kubectl logs deployment/soroscan-worker-low -n soroscan --tail=100
kubectl logs deployment/soroscan-worker-backfill -n soroscan --tail=100
```

## 3.5 Verify Beat

```bash
kubectl get deployment soroscan-beat -n soroscan
kubectl logs deployment/soroscan-beat -n soroscan --tail=100
```

---

# 4. Kubernetes rollback

## 4.1 Inspect rollout history

```bash
kubectl rollout history deployment/soroscan-backend -n soroscan
```

## 4.2 Roll back the backend

Roll back one revision:

```bash
kubectl rollout undo deployment/soroscan-backend -n soroscan
kubectl rollout status deployment/soroscan-backend -n soroscan
```

Or roll back to a specific revision:

```bash
kubectl rollout undo deployment/soroscan-backend --to-revision=<revision> -n soroscan
```

## 4.3 Roll back workers and Beat

If the same release changed worker or scheduler images, roll them back too:

```bash
kubectl rollout undo deployment/soroscan-worker-high -n soroscan
kubectl rollout undo deployment/soroscan-worker-default -n soroscan
kubectl rollout undo deployment/soroscan-worker-low -n soroscan
kubectl rollout undo deployment/soroscan-worker-backfill -n soroscan
kubectl rollout undo deployment/soroscan-beat -n soroscan
```

Verify:

```bash
kubectl get deployments -n soroscan
kubectl get pods -n soroscan
```

## 4.4 Roll back configuration

Deployment rollout history does not restore previous ConfigMap or Secret content.

Reapply the known-good configuration from version control or your secret manager, then restart affected deployments:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/soroscan-backend -n soroscan
kubectl rollout restart deployment/soroscan-worker-high -n soroscan
kubectl rollout restart deployment/soroscan-worker-default -n soroscan
kubectl rollout restart deployment/soroscan-worker-low -n soroscan
kubectl rollout restart deployment/soroscan-worker-backfill -n soroscan
kubectl rollout restart deployment/soroscan-beat -n soroscan
```

Always treat database migrations separately from Kubernetes object rollback. Confirm migration compatibility before rolling application images backward.

---

# 5. Helm deployment

The repository currently provides production-oriented values at:

```text
docs/deployment/helm/values-production.yaml
```

Use those values with a compatible SoroScan Helm chart supplied by your deployment environment.

## 5.1 Review production values

At minimum, replace:

- `image.repository`;
- `image.tag`;
- ingress host and annotations;
- database and Redis endpoints;
- secret placeholders.

Do not commit real secret values into the repository.

## 5.2 Install or upgrade

```bash
helm upgrade --install soroscan <chart-path-or-reference>   --namespace soroscan   --create-namespace   -f docs/deployment/helm/values-production.yaml
```

Wait for Kubernetes resources to become ready:

```bash
kubectl get pods -n soroscan
```

## 5.3 Verify the Helm release

```bash
helm status soroscan -n soroscan
helm history soroscan -n soroscan
```

Then run the same backend health verification described in the Kubernetes section.

## 5.4 Helm rollback

List revisions:

```bash
helm history soroscan -n soroscan
```

Roll back:

```bash
helm rollback soroscan <revision> -n soroscan --wait
```

Verify:

```bash
helm status soroscan -n soroscan
kubectl get pods -n soroscan
```

---

# 6. Post-deployment checklist

After any Docker Compose, Kubernetes, or Helm deployment:

- [ ] application containers/pods are running;
- [ ] backend endpoint responds successfully;
- [ ] frontend loads when deployed;
- [ ] Celery workers remain connected and processing;
- [ ] Celery Beat has exactly one active scheduler;
- [ ] application logs contain no repeated startup errors;
- [ ] database migrations completed successfully;
- [ ] ingress/TLS resolves correctly for production;
- [ ] rollback revision or known-good image/tag is recorded;
- [ ] secrets are stored outside version control.

For incident-specific procedures, see [`deployment/playbooks/`](./deployment/playbooks/).
