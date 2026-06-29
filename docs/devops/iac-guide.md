# Infrastructure as Code Guide

This guide documents the Infrastructure as Code tools used in SoroScan, including Terraform, Helm, and GitHub Actions workflows.

## Overview

SoroScan infrastructure can be deployed using Terraform for cloud or infrastructure provisioning, Helm for Kubernetes packaging, and GitHub Actions for CI/CD workflows.

This guide covers:
- Terraform modules, variables, outputs, provider configuration, and workspace management.
- Helm chart structure, values, subcharts, dependencies, testing, and release notes.
- GitHub Actions workflow explanation, CI/CD stages, secrets, artifact handling, and triggers.
- Local development using Terraform, Minikube, Helm, and Skaffold.
- Deployment workflows for development, staging, production.
- Rollback and blue-green deployment best practices.
- Troubleshooting commands for Terraform, Helm, and CI failures.

## Terraform Documentation

### What to document

For each Terraform module, include:
- Purpose and scope
- Supported providers
- Required and optional input variables
- Output values
- Version constraints and source information
- Recommended workspace layout

### Module descriptions

Create reusable modules for infrastructure components such as:
- `network` / VPC and networking resources
- `database` / PostgreSQL or managed database
- `cache` / Redis or shared cache
- `kubernetes` / EKS, GKE, AKS cluster provisioning
- `app` / deployment resources, load balancer, service discovery

A module should encapsulate one responsibility and expose only the configuration required by callers.

### Input variables explained

For each variable, provide:
- Name
- Type
- Default value (if any)
- Description
- Validation rules
- Example usage

Example:
```hcl
variable "region" {
  description = "Primary region for resource creation."
  type        = string
  default     = "us-east-1"
}
```

### Output descriptions

Document each output with:
- Name
- Value type
- What it represents
- Typical consumers

Example:
```hcl
output "db_endpoint" {
  description = "Connection endpoint for the PostgreSQL database."
  value       = module.database.endpoint
}
```

### Provider configuration

Providers should be configured centrally, typically in a root module or dedicated provider file.

Example:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = var.region
}
```

### Module versioning

Use fixed provider and module version constraints.
- `~> 3.0` for backwards-compatible updates
- `>= 1.0, < 2.0` when avoiding breaking changes

Reference modules by source and version:
```hcl
module "database" {
  source  = "git::https://github.com/SoroScan/terraform-modules.git//database?ref=v1.2.0"
  ...
}
```

### Workspace management

Terraform workspaces separate state for environments.
- `terraform workspace new dev`
- `terraform workspace select staging`

Keep one state per environment and never share state files between environments.

## Helm Charts Documentation

### Chart structure overview

A Helm chart should include:
- `Chart.yaml`
- `values.yaml`
- `templates/`
- `charts/` (optional dependencies)
- `templates/_helpers.tpl`

### Values documentation

Document top-level values and all the key configuration blocks:
- `image.repository`
- `image.tag`
- `replicaCount`
- `service.type`
- `env`
- `resources`
- `persistence`

Example values documentation:
```yaml
image:
  repository: soroscan/backend
  tag: "latest"
service:
  type: ClusterIP
  port: 8000
```

### Subcharts and dependencies

Use `requirements.yaml` or `Chart.yaml` dependencies to manage common subcharts:
- `postgresql`
- `redis`
- `ingress-nginx`

Example dependency block in `Chart.yaml`:
```yaml
dependencies:
  - name: postgresql
    version: 12.9.8
    repository: https://charts.bitnami.com/bitnami
```

### Chart testing procedures

Testing Helm charts should include:
- `helm lint ./chart`
- `helm template ./chart --values values.yaml`
- `helm install --dry-run --debug ./chart`
- Running Kubernetes conformance tests against a local cluster

### Release notes for chart versions

Record chart version changes in release notes or changelog entries, including:
- New features
- Configuration changes
- Breaking changes
- Dependency upgrades

## GitHub Actions Workflows

### Workflow files explained

Document each workflow file and its purpose. Example workflows in this repository:
- `.github/workflows/django.yml` — backend tests and linting for Django
- `.github/workflows/frontend-ci.yml` — frontend install, lint, test
- `.github/workflows/sdk-release.yml` — SDK release process

### CI/CD pipeline stages

Common workflow stages:
- checkout
- setup dependencies
- test
- lint
- build
- package
- deploy

### Secrets management

Store secrets in GitHub Actions secrets and do not commit them.
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DOCKERHUB_TOKEN`
- `KUBE_CONFIG_DATA`

Use secrets safely in workflows:
```yaml
- name: Configure AWS
  run: aws configure set aws_access_key_id ${{ secrets.AWS_ACCESS_KEY_ID }}
```

### Artifact handling

Use workflow `upload-artifact` and `download-artifact` for packages or build outputs.

### Deployment triggers

Document when each workflow runs:
- on `push` to main or release branches
- on `pull_request`
- on `workflow_dispatch`
- on `tags`

## Local Development with IaC

### Terraform for local setup

1. Install Terraform
2. Initialize the workspace:
```bash
terraform init
```
3. Validate configuration:
```bash
terraform validate
```
4. Preview changes:
```bash
terraform plan -out=tfplan
```

### Minikube with local Helm charts

1. Start Minikube:
```bash
minikube start --driver=docker
```
2. Install the chart:
```bash
helm install soroscan ./chart --values values-dev.yaml
```
```

### Skaffold for local development

Use Skaffold to build and deploy local code changes if your project adds a `skaffold.yaml` file.

Basic workflow:
```bash
skaffold dev
```

## Deployment Workflows

### Development deployment

Use a lightweight environment with local overrides:
- dev database
- local Docker registries
- reduced replicas

Example Helm install:
```bash
helm upgrade --install soroscan ./chart --values values-dev.yaml
```

### Staging deployment

Staging should mirror production with safe test data and automated deployment.
- separate namespace
- separate state file
- feature branch preview

### Production deployment

Production deployments must be controlled and secure.
- pinned chart versions
- immutable image tags
- manual approval step for deployments

### Rollback procedures

Use Helm rollback for chart upgrades:
```bash
helm rollback soroscan 1
```

For Terraform, restore state from backup and re-apply the previous configuration.

### Blue-green deployments

Implement blue-green with:
- separate release names or namespaces
- traffic switching via ingress or service selectors
- health checks before cutover

## Best Practices

### State file management

- Use remote state backends (S3, GCS, Azure Storage)
- Enable state locking
- Keep state files out of source control

### Secrets in IaC

- Use secret stores or provider-specific secret objects
- Never store secrets in `terraform.tfvars` or `values.yaml`
- Use GitHub Actions secrets for CI/CD

### Code review for IaC

- Review Terraform plans, Helm templates, and workflow changes
- Validate `terraform fmt` and `helm lint`
- Run tests on a pull request before merge

### Testing IaC changes

- `terraform plan`
- `helm lint`
- `helm template`
- Integration / smoke tests in a staging cluster

### Documentation in IaC

- Comment module blocks
- Document variable purpose and example values
- Keep charts and workflows readable

## Troubleshooting IaC

### Plan vs apply differences

- `terraform plan` shows proposed changes
- `terraform apply` executes changes
- If plan and apply differ, re-run `terraform plan` after state updates

### Helm upgrade failures

Common causes:
- invalid template values
- missing Kubernetes resources
- image pull errors

Troubleshooting commands:
```bash
helm status soroscan
helm history soroscan
kubectl describe pod -l app=soroscan
kubectl logs deployment/soroscan-backend
```

### Terraform remote state issues

Common issues:
- backend misconfiguration
- missing access permissions
- stale workspace selection

Troubleshooting:
```bash
terraform workspace show
terraform init -reconfigure
terraform state list
```

### CI/CD pipeline failures

- Inspect workflow logs in GitHub Actions
- Check environment and secrets
- Re-run failed jobs after fixing configuration

## References

- Terraform: https://www.terraform.io/docs
- Helm: https://helm.sh/docs/
- GitHub Actions: https://docs.github.com/actions
