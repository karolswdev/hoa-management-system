# Traceability Matrix -- System Requirements

This document maps system-level requirements to their downstream service-level implementations.

> **Note:** Because this system is a monorepo (not microservices), service-level SRS documents are not produced separately. All requirements are implemented within the single Express.js backend. This traceability matrix maps system requirements to the **modules/files** that implement them.

---

## Committee Management

| System Requirement ID | Title | Tier | Implementation Module |
|-----------------------|-------|------|-----------------------|
| SYS-FUNC-001 | Admin creates committee | MVP | `committee.service.js`, `committee.controller.js`, `committee.routes.js` |
| SYS-FUNC-002 | Admin updates committee | MVP | `committee.service.js`, `committee.controller.js` |
| SYS-FUNC-003 | Soft-deactivate committee | MVP | `committee.service.js`, `committee.controller.js` |
| SYS-FUNC-004 | Admin appoints committee member | MVP | `committee.service.js`, `committee.controller.js` |
| SYS-FUNC-005 | Admin removes committee member | MVP | `committee.service.js`, `committee.controller.js` |
| SYS-FUNC-006 | Authenticated users view committees | MVP | `committee.service.js`, `committee.controller.js` |
| SYS-FUNC-007 | Prevent duplicate membership | MVP | `committee.service.js`, `CommitteeMember` model (UNIQUE constraint) |
| SYS-FUNC-008 | Display chair prominently | MVP | Frontend: `CommitteeDetail` component |
| SYS-FUNC-009 | Audit log committee actions | MVP | `committee.service.js`, `audit.service.js` |

## Approval Workflow Engine

| System Requirement ID | Title | Tier | Implementation Module |
|-----------------------|-------|------|-----------------------|
| SYS-FUNC-010 | Workflow statuses | MVP | `workflow.service.js` (status enum) |
| SYS-FUNC-011 | State machine enforcement | MVP | `workflow.service.js` (transition map) |
| SYS-FUNC-012 | Workflow linked to committee | MVP | `WorkflowInstance` model (committee_id FK) |
| SYS-FUNC-013 | Review comments | MVP | `workflow.service.js`, `WorkflowComment` model |
| SYS-FUNC-014 | File attachments | MVP | `workflow.service.js`, `WorkflowAttachment` model, `upload.middleware.js` |
| SYS-FUNC-015 | Transition audit trail | MVP | `WorkflowTransition` model |
| SYS-FUNC-016 | Optional expiration | MVP | `WorkflowInstance.expires_at`, lazy check on read |
| SYS-FUNC-017 | Configurable default expiration | MVP | `Config` table entry `arc_default_expiration_days` |
| SYS-FUNC-018 | Submitter can withdraw | MVP | `workflow.service.js` (transition logic) |
| SYS-FUNC-019* | Email notifications on transitions | MVP | `email.service.js` (new templates) |
| SYS-FUNC-020 | Audit log transitions | MVP | `workflow.service.js`, `audit.service.js` |
| SYS-FUNC-021 | Single appeal support | MVP | `workflow.service.js` (appeal transitions) |
| SYS-FUNC-022 | Max one appeal | MVP | `WorkflowInstance.appeal_count` check |
| SYS-FUNC-023 | Polymorphic request reference | MVP | `WorkflowInstance` model (request_type, request_id) |

## ARC Request Type

| System Requirement ID | Title | Tier | Implementation Module |
|-----------------------|-------|------|-----------------------|
| SYS-FUNC-024 | Create ARC request | MVP | `arcRequest.service.js`, `arcRequest.controller.js` |
| SYS-FUNC-025 | Default ARC categories | MVP | `ArcCategory` model, seed script |
| SYS-FUNC-026 | Admin-configurable categories | MVP | `arcCategory.controller.js`, `arcCategory.routes.js` |
| SYS-FUNC-027 | File attachments on ARC | MVP | `workflow.service.js` (attachment via workflow) |
| SYS-FUNC-028 | Property address on request | MVP | `ArcRequest` model (property_address field) |
| SYS-FUNC-029 | Auto-create workflow instance | MVP | `arcRequest.service.js` calls `workflow.service.js` |
| SYS-FUNC-030 | Submitter views own requests | MVP | `arcRequest.controller.js` (filtered by user) |
| SYS-FUNC-031 | Committee views assigned requests | MVP | `arcRequest.controller.js` + `committee.service.js` |
| SYS-FUNC-032 | Admin views all requests | MVP | `arcRequest.controller.js` (admin bypass) |
| SYS-FUNC-033 | Detail view with full history | MVP | `arcRequest.controller.js` + `workflow.service.js` |

## Security

| System Requirement ID | Title | Tier | Implementation Module |
|-----------------------|-------|------|-----------------------|
| SYS-SEC-001 | JWT required on all endpoints | MVP | `auth.middleware.js` (verifyToken) |
| SYS-SEC-002 | Admin-only committee management | MVP | `auth.middleware.js` (authorizeRoles) |
| SYS-SEC-003 | Committee member review restriction | MVP | New `authorizeCommitteeMember` middleware |
| SYS-SEC-004 | Committee membership verification | MVP | New `authorizeCommitteeMember` middleware |
| SYS-SEC-005 | File upload validation | MVP | `upload.middleware.js` (existing) |
| SYS-SEC-006 | XSS sanitization | MVP | `validate.middleware.js` / sanitize in service layer |
| SYS-SEC-007* | Authorization on detail views | MVP | Controller-level checks |

## Mid-Maturity Additions

| System Requirement ID | Title | Tier | Implementation Module |
|-----------------------|-------|------|-----------------------|
| SYS-FUNC-040 | Cron-based expiration | mvp-mid | New scheduled task / cron job |
| SYS-FUNC-041 | Quorum per committee | mvp-mid | `Committee` model (quorum field), `workflow.service.js` |
| SYS-FUNC-042 | Dynamic form fields per category | mvp-mid | New `ArcCategoryField` model |
| SYS-FUNC-043 | Individual review votes | mvp-mid | New `WorkflowReviewVote` model |
| SYS-FUNC-044 | Primary reviewer assignment | mvp-mid | `WorkflowInstance` model (assigned_to field) |
| SYS-FUNC-045 | Committee dashboard | mvp-mid | New controller + aggregation queries |
| SYS-FUNC-046 | Reminder emails | mvp-mid | Cron job + email.service.js |
| SYS-OBS-001 | Prometheus metrics | mvp-mid | New metrics middleware |
| SYS-OBS-002 | Correlation IDs | mvp-mid | Logging middleware enhancement |
| SYS-SEC-010 | Rate limiting on transitions | mvp-mid | rate-limit config |
| SYS-OPS-010 | Kubernetes deployment | mvp-mid | Helm chart / Kustomize |
