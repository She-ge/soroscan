---
slug: /deployment/runbooks

title: Runbooks & Incident Procedures
description: Practical runbooks for common production incidents.
sidebar_label: Runbooks
hide_title: false
---

This page contains concise runbooks for common incidents and emergency procedures.

## Emergency restart procedure
1. Notify on-call via PagerDuty/Slack.
2. Scale down non-critical replicas if needed to free resources.
3. Restart Django pods:
```bash
kubectl rollout restart deployment/soroscan-backend -n soroscan
kubectl rollout status deployment/soroscan-backend -n soroscan
```
4. Restart Celery workers and monitor Celery queue depth.

## Database failover (managed)
1. Promote read replica (RDS/Cloud provider) to primary.
2. Update application `DATABASE_URL` secrets and restart deployments.
3. Verify data integrity and application readiness.

## Rolling update procedure (zero-downtime)
1. Use readiness probes and set `maxUnavailable: 1`, `maxSurge: 1` in `Deployment`.
2. Deploy new container image with `helm upgrade --install`.
3. Monitor health checks and roll back on failure:
```bash
kubectl rollout undo deployment/soroscan-backend -n soroscan
```

## Scaling during peak load
- Increase backend and worker replicas.
- Temporarily increase DB instance class and connection pool limits.
- Communicate expected load to stakeholders and delay non-critical jobs.

## Post-incident checklist
- Document timeline and root cause.
- Create follow-up tasks for recurring issues.
- Review and update runbooks.
