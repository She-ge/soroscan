# Deployment: Cloud Platforms

SoroScan is built with cloud-neutrality in mind. You can deploy it to any major cloud provider (AWS, GCP, Azure,
DigitalOcean) using either standard VMs or managed Kubernetes services.

## Recommended Cloud Stack

- **Managed Database**: Use RDS (AWS), Cloud SQL (GCP), or managed PostgreSQL.
- **Managed Redis**: Use ElastiCache (AWS) or MemoryStore (GCP).
- **Object Storage**: For storing static files and exports, use S3-compatible storage.
- **Container Registry**: Use ECR, GCR, or Docker Hub to host your custom images.

## Generic Self-Hosted (VMs)

If you prefer using virtual machines (ECE, Droplets), we recommend the following process:

### 1. Environment Setup

- Provision a VM with at least **4GB RAM** and **2 CPUs**.
- Install Docker and Docker Compose.

### 2. CI/CD Pipeline

- Set up a GitHub Action or Gitlab CI to:
  1. Build Docker images from the `django-backend` and `soroscan-frontend` folders.
  1. Push images to your registry.
  1. Deploy using `docker-compose.prod.yml` (recommended to create a production-specific compose file for your
     environment).

## Specific Cloud Tips

### AWS (Amazon Web Services)

- Deploy to **EKS** for Kubernetes or **ECS (Fargate)** for serverless containers.
- Use **ALB** (Application Load Balancer) for ingress.
- Store secrets in **Secrets Manager**.

### DigitalOcean

- Use **DigitalOcean Kubernetes (DOKS)** for the easiest K8s experience.
- Leverage **Managed Databases** to offload DB maintenance.

## Production Checklist

- [ ] Disable `DEBUG` in your backend `.env`.
- [ ] Configure a strong `SECRET_KEY`.
- [ ] Set up **HTTPS** (via Certbot or Cloud Load Balancer).
- [ ] Configure **Sentry** or similar for error tracking.
- [ ] Set up **Grafana/Prometheus** for resource monitoring.
