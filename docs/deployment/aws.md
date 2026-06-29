---
slug: /deployment/aws

title: AWS EKS Deployment (Terraform + Helm)
description: Example for deploying SoroScan to AWS EKS using Terraform and Helm charts.
sidebar_label: AWS / EKS
hide_title: false
---

This guide provides a pragmatic EKS deployment path using Terraform to provision infrastructure and Helm to deploy the SoroScan application.

Warning: These are example snippets—adapt to your security, networking, and compliance needs.

## High-level steps
1. Provision EKS cluster and networking with Terraform.
2. Provision managed RDS Postgres and ElastiCache Redis.
3. Build and push container images to ECR.
4. Deploy SoroScan via Helm using `values.yaml` tuned for production.
5. Configure Ingress with ALB / ACM for TLS.

## Example Terraform snippet (very condensed)

```hcl
# providers.tf
provider "aws" { region = var.region }

# eks cluster (module)
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  cluster_name = "soroscan-cluster"
  cluster_version = "1.26"
  vpc_id = var.vpc_id
  subnet_ids = var.private_subnet_ids
  node_groups = {
    default = { desired_capacity = 3, instance_type = "t3.medium" }
  }
}

# RDS Postgres
resource "aws_db_instance" "postgres" {
  identifier = "soroscan-db"
  engine = "postgres"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  name = "soroscan"
  username = var.db_user
  password = var.db_password
  publicly_accessible = false
}
```

## Helm deploy (recommended)
- Create a `values-production.yaml` that sets `replicaCount` for backend and worker, resource requests/limits, and PostgreSQL connection via `DATABASE_URL` secret.
- Use `helm upgrade --install soroscan ./helm-chart -f values-production.yaml`

## Networking and TLS
- Use AWS ACM to issue TLS certs and ALB Ingress Controller (AWS Load Balancer Controller) to provision ALBs automatically.
- Configure DNS to point to ALB.

## Cost estimate (small production)
- EKS control + 3 `t3.medium` nodes: ~ $100–150/month
- RDS `db.t3.medium` (100GB): ~ $100–200/month
- ElastiCache (single node): ~$40/month
- ALB and network transfer: variable

Adjust instance sizes and storage for production loads.

## Notes
- Use parameter groups and backups for RDS.
- Use IAM roles for service accounts (IRSA) for fine-grained access.
- Rotate credentials and secrets using AWS Secrets Manager or SSM Parameter Store.
