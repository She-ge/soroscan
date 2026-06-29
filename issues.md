#499 SDK Development Guide
Repo Avatar
SoroScan/soroscan
Title: docs: create comprehensive SDK development documentation

Labels: documentation sdk
Complexity: trivial

Description:
Create guide for SDK development including:

Architecture overview
How to add new API methods
Type generation workflow
Testing requirements
Release process
Acceptance Criteria:

 Development guide created
 Step-by-step instructions
 Examples included
 Linked from main docs

 #502 Security Hardening Checklist
Repo Avatar
SoroScan/soroscan
Title: docs: create pre-deployment security checklist

Labels: documentation security
Complexity: trivial

Description:
Document security requirements before deploying to production:

Environment variable validation
SSL/TLS configuration
Authentication settings
Authorization rules
Database encryption
Secrets management
Acceptance Criteria:

 Security checklist created
 Verification steps for each item
 Automation where possible
 Linked from deployment guide
 
 #503 Soroban Contract Integration Guide
Repo Avatar
SoroScan/soroscan
Title: docs: create guide for integrating custom Soroban contracts with SoroScan

Labels: documentation smart-contracts
Complexity: medium

Description:
Document how contract developers can integrate their contracts with SoroScan:

Event emission standards
ABI registration process
Testing event ingestion
Webhook configuration
Monitoring integration
Acceptance Criteria:

 Integration guide created
 Example contract included
 Step-by-step walkthrough
 Troubleshooting section

 #504 API Rate Limit Headers Standardization
Repo Avatar
SoroScan/soroscan
Title: feat: standardize rate limit response headers

Labels: enhancement api
Complexity: trivial

Description:
Add standard rate limit headers to all API responses per RateLimit-* HTTP specification:

RateLimit-Limit: requests per window
RateLimit-Remaining: requests left
RateLimit-Reset: timestamp when limit resets
Acceptance Criteria:

 Headers added to all API endpoints
 Headers accurate and consistent
 Tested across endpoints
 Documented in API guide
