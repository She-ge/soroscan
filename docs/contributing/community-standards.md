---
slug: /contributing/community-standards

title: Community Standards & Code of Conduct
description: Issue triage procedures, communication standards, mentorship programs, and contributor recognition policies at SoroScan.
sidebar_label: Community Standards
hide_title: false
---

# Community Standards & Contributor Growth

SoroScan is built by and for developers. We strive to maintain a healthy, welcoming, and productive community. This document outlines our Code of Conduct, communication standards, issue triage procedures, and contributor growth pathways.

---

## 1. Code of Conduct

We are committed to making participation in our project a harassment-free experience for everyone, regardless of level of experience, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### 1.1 Core Expectations
- **Be respectful and collaborative**: Encourage constructive discussions and feedback.
- **Focus on the community**: Prioritize the long-term success of SoroScan and its users.
- **Show empathy**: Understand that other contributors have different backgrounds, constraints, and time commitments.

---

## 2. Communication Channels & Norms

- **GitHub Issues**: Used strictly for bug reports, concrete feature requests, and tasks.
- **GitHub Discussions**: Used for architectural proposals (RFCs), questions, user support, and open-ended design debates.
- **Slack / Discord**: Used for real-time developer coordination, social chat, and quick announcements.

### 2.1 Communication Best Practices
- **Do not tag maintainers individually** for immediate reviews unless it is an emergency security fix. Let the assignees handle PR assignments.
- **Write comprehensive comments**: Provide context, reproduction steps, and screenshots when discussing technical issues.

---

## 3. Issue Management

We use a structured triage system to organize tasks and manage contributor workloads.

### 3.1 Issue Labeling System
We use standard labels to categorize issues:
- **`good-first-issue`**: Simple fixes or updates suitable for first-time contributors.
- **`bug`**: Something isn't working as intended.
- **`enhancement`**: A new feature proposal or user experience improvement.
- **`documentation`**: Missing or outdated documentation guides.
- **`priority/high`**: Blockers, critical bugs, or core path dependencies.
- **`help-wanted`**: Ready for external contribution, but requires specific skills or deep context.

### 3.2 Triaging & Prioritizing Issues
Maintainers review new issues weekly.
1. **Validation**: Check for complete description and reproduction steps. If incomplete, apply the `needs-info` label and ask the reporter.
2. **Prioritization**: Classify severity:
   - **P0 (Critical)**: Site down, data corruption, security leak. Must be resolved immediately.
   - **P1 (High)**: Major features broken, regression in event indexing.
   - **P2 (Medium)**: Normal feature requests, non-blocking bug fixes.
   - **P3 (Low)**: Minor UI tweaks, typo corrections, background cleanups.
3. **Assignment**: Contributors can request to work on an issue by commenting **"I would like to work on this issue."** Once approved, a maintainer will assign the issue to you. Do not begin working on it until you are assigned.

---

## 4. Contributor Recognition & Growth

We believe in recognizing the hard work of our community members.

### 4.1 All-Contributors Hall of Fame
We use the `all-contributors` bot to recognize all forms of contributions (code, docs, design, translation, triage, community support).
- Contributors are listed in the [CONTRIBUTORS.md](file:///workspaces/soroscan/CONTRIBUTORS.md) file (Hall of Fame).
- If your contribution was merged and you weren't added, submit a comment on your PR asking to be added.

### 4.2 Swag and Rewards
For major milestones (e.g., building a complete SDK feature, optimizing the indexer speed by >30%, or maintaining documentation for 3 months), contributors are eligible for SoroScan swag (stickers, t-shirts, hoodies) or stellar community rewards.

### 4.3 Mentorship Opportunities
If you want to contribute to SoroScan but feel you lack experience with Rust, Soroban, or Django, we offer pairing sessions.
- Open a discussion topic in the **"Mentorship"** category on GitHub Discussions.
- A senior maintainer will pair up with you to walk through the codebase and guide your development.

---

## 5. Becoming a Maintainer

Active contributors who demonstrate a deep understanding of the codebase, help triage issues, write high-quality reviews, and adhere to our values can be invited to join as **SoroScan Maintainers**.

### 5.1 Maintainer Responsibilities
- Review and merge community PRs.
- Assist in designing feature roadmaps and system architecture.
- Keep the SoroScan community safe and productive.
- Write technical documentation and tutorials.
