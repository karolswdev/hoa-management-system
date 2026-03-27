---
title: "System SRS - Committees, Approval Workflow & ARC (Target / Long-Term)"
version: 0.1.0
status: Draft
owners: []
baseline: false
created: 2026-03-26
updated: 2026-03-26
---

# System SRS -- Target (Long-Term) Tier

This document describes the long-term vision. All MVP and Mid-Maturity requirements remain in force. This tier adds cloud integration, advanced workflow capabilities, and mature infrastructure.

---

## 1. Functional Requirements (Additions)

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-FUNC-060 | The workflow engine MUST support multi-committee approval chains where a request requires sequential or parallel approval from multiple committees. | MUST |
| SYS-FUNC-061 | The system MUST support bulk operations: bulk approve, bulk deny, bulk reassign for admin users. | MUST |
| SYS-FUNC-062 | The system SHOULD provide a public-facing request status portal where residents can check their request status without full authentication (via a unique link/token). | SHOULD |
| SYS-FUNC-063 | The system SHOULD support request templates that pre-fill form fields for common modification types. | SHOULD |
| SYS-FUNC-064 | The system SHOULD support per-committee notification preferences (opt-in/opt-out for specific event types). | SHOULD |
| SYS-FUNC-065 | The system SHOULD support webhook integrations to notify external systems of workflow state changes. | SHOULD |
| SYS-FUNC-066 | The system SHOULD provide reporting and analytics: approval rates by category, average time-to-decision trends, committee workload over time. | SHOULD |
| SYS-FUNC-067 | The system MAY support a mobile-optimized view or PWA for field inspections by committee members. | MAY |

---

## 2. Non-Functional Requirements (Additions)

### 2.1 Infrastructure

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-PORT-001 | The system SHOULD support cloud-native file storage (AWS S3 or compatible) for workflow attachments, with local disk as fallback. | SHOULD |
| SYS-AVAIL-001 | The system SHOULD support multi-region or HA deployment for critical availability. | SHOULD |
| SYS-PERF-020 | The system SHOULD support database migration to PostgreSQL for improved concurrency and advanced query capabilities. | SHOULD |

### 2.2 Cost

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-COST-001 | Cloud storage costs SHOULD be monitored and capped with lifecycle policies (archive attachments older than 2 years). | SHOULD |

---

## 3. WILL-NOT (Target Tier -- Permanent Exclusions)

| Permanently Excluded | Rationale |
|----------------------|-----------|
| Real-time collaborative editing of requests | Unjustified complexity for HOA scale |
| AI/ML-based auto-approval | Liability and trust concerns for HOA governance |
| Native mobile applications (iOS/Android) | PWA covers the need adequately |
| Integration with county/city permitting systems | Out of scope for community self-governance |

---

## 4. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-03-26 | Requirements Architect | Initial draft |
