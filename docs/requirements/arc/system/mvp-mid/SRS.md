---
title: "System SRS - Committees, Approval Workflow & ARC (Mid-Maturity)"
version: 0.1.0
status: Draft
owners: []
baseline: false
created: 2026-03-26
updated: 2026-03-26
---

# System SRS -- Mid-Maturity Tier

This document extends the MVP SRS with capabilities appropriate for a maturing deployment. All MVP requirements (SYS-*) remain in force. This tier adds observability, stronger operational tooling, and workflow enhancements.

---

## 1. Functional Requirements (Additions)

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-FUNC-040 | The system MUST implement a cron-based scheduler that checks for expired approvals daily and transitions them to `expired` status automatically. | MUST |
| SYS-FUNC-041 | The system MUST support a configurable minimum reviewer count (quorum) per committee before a decision (approve/deny) can be finalized. | MUST |
| SYS-FUNC-042 | The workflow engine MUST support per-category dynamic form fields (admin-defined key/value pairs) that extend the base ARC request schema. | SHOULD |
| SYS-FUNC-043 | The system MUST allow committee members to cast individual review votes (approve/deny/abstain) that are tallied against the quorum threshold. | MUST |
| SYS-FUNC-044 | The system SHOULD support request assignment to a specific committee member for primary review, while still requiring quorum. | SHOULD |
| SYS-FUNC-045 | The system MUST provide a committee dashboard showing: pending requests count, average review time, overdue requests. | MUST |
| SYS-FUNC-046 | The system SHOULD send reminder emails for requests that have been in `under_review` or `appeal_under_review` for more than a configurable number of days. | SHOULD |

---

## 2. Non-Functional Requirements (Additions)

### 2.1 Observability

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-OBS-001 | The system MUST expose Prometheus-compatible metrics for: request count by status, average review duration, committee workload. | MUST |
| SYS-OBS-002 | The system MUST include structured log correlation IDs for all workflow operations. | MUST |
| SYS-OBS-003 | The system SHOULD provide a health check endpoint that includes workflow engine status and pending expiration count. | SHOULD |

### 2.2 Security (Enhancements)

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-SEC-010 | The system MUST implement rate limiting on workflow transition endpoints (max 10 transitions per minute per user). | MUST |
| SYS-SEC-011 | The system SHOULD implement CSRF protection on all state-changing endpoints. | SHOULD |

### 2.3 Performance (Enhancements)

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-PERF-010 | Committee dashboard aggregation queries MUST respond within 1 second for up to 5000 workflow instances. | MUST |

### 2.4 Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-OPS-010 | The system MUST support Kubernetes deployment via Helm chart or Kustomize manifests. | MUST |
| SYS-OPS-011 | The system MUST provide a database backup strategy that includes workflow and committee data. | MUST |

---

## 3. WILL-NOT (Mid-Maturity Deferrals)

| Deferred Capability | Deferred To | Rationale |
|---------------------|-------------|-----------|
| Multi-committee approval chains | target | Still premature for community size |
| Bulk operations on requests | target | Volume does not justify |
| Public-facing request status portal | target | Community preference for members-only |
| Request templates / saved drafts | target | Nice-to-have |
| Cloud-native storage (S3) for attachments | target | Local disk sufficient at this scale |
| Multi-region / HA deployment | target | Single-region sufficient |
| Committee-specific notification preferences | target | Still uniform in mid-maturity |
| Webhook integrations for external systems | target | No external system integrations needed yet |

---

## 4. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-03-26 | Requirements Architect | Initial draft |
