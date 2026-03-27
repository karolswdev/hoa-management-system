---
title: "System SRS - Committees, Approval Workflow & Architectural Review"
version: 0.1.0
status: Draft
owners: []
baseline: false
created: 2026-03-26
updated: 2026-03-26
---

# System SRS -- MVP Tier

## 1. Overview & Objectives

This document specifies the MVP requirements for three layered capabilities added to the HOA Management System:

1. **Committees** -- A generic entity for creating and managing named committees with appointed members.
2. **Approval Workflow Engine** -- A reusable, domain-agnostic workflow that supports status transitions, reviewer assignment, comments, file attachments, and notifications.
3. **Architectural Review Committee (ARC) Requests** -- The first domain-specific request type that plugs into the workflow engine and is assigned to the "Architectural Review" committee.

### MVP Philosophy

The MVP ships the smallest useful slice: residents can submit ARC requests, committee members can review them, and admins can manage committees. The workflow engine is designed for reuse but only the ARC request type exists at this tier. Logging is structured (console/winston); no observability stack. Docker-compose-first. Baseline secure-by-default (JWT auth, role checks, input validation, audit logging).

---

## 2. Stakeholders & Personas

| Persona | Description |
|---------|-------------|
| **Resident (Member)** | Submits ARC requests for property modifications. Tracks status of own requests. May appeal denied requests. |
| **Committee Member** | Appointed to one or more committees by an admin. Reviews requests assigned to their committee. Votes/comments on requests. |
| **Admin** | Creates committees, appoints/removes committee members, configures workflow defaults, has full visibility into all requests and committees. **Cannot review/approve/deny requests unless explicitly appointed as a committee member.** May appoint themselves if needed. |

---

## 3. Scope & Out-of-Scope

### In Scope (MVP)

- Committee CRUD (admin)
- Committee membership management (admin appoints members)
- Generic approval workflow engine (status machine, comments, attachments, reviewer assignment)
- ARC request submission by residents
- ARC request review by committee members
- Single-level appeal on denied requests
- Optional expiration on approvals (admin-configurable default)
- Email notifications on key transitions
- Audit logging of all state changes
- File attachments on requests (reuses existing upload middleware)

### Out-of-Scope (MVP) -- see WILL-NOT section

---

## 4. Domain Context & Potential Use Cases

The ARC process is common in HOAs: residents must get approval before making exterior modifications (fences, paint, landscaping, etc.). The committee reviews requests for compliance with community standards.

Future consumers of the workflow engine (not in MVP):
- Maintenance requests assigned to a Facilities committee
- Budget approval workflows assigned to a Finance committee
- Social event proposals assigned to a Social committee

---

## 5. Interfaces & Contracts

All interfaces are defined in [ICD.md](../common/ICD.md).

Key integration points with the existing system:
- **Auth middleware**: Reuses `verifyToken`, `authorizeRoles`, `optionalAuth` from `auth.middleware.js`. A new `authorizeCommitteeMember` middleware MUST be added.
- **Upload middleware**: Reuses existing `multer` configuration from `upload.middleware.js` for file attachments.
- **Email service**: Extends `email.service.js` with new notification templates (request-submitted, status-changed, comment-added, appeal-filed).
- **Audit logging**: Reuses `AuditLog` model for all committee and workflow state changes.
- **User model**: Referenced via foreign keys; no changes to the User model itself.

---

## 6. Functional Requirements

### 6.1 Committee Management

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-FUNC-001 | The system MUST allow admins to create a committee with a name, description, and active/inactive status. | MUST |
| SYS-FUNC-002 | The system MUST allow admins to update a committee's name, description, and status. | MUST |
| SYS-FUNC-003 | The system MUST allow admins to soft-deactivate a committee (set status to inactive) rather than hard-delete when the committee has associated requests. | MUST |
| SYS-FUNC-004 | The system MUST allow admins to appoint an approved, non-system user as a member of a committee with a designated role (member or chair). | MUST |
| SYS-FUNC-005 | The system MUST allow admins to remove a user from a committee. | MUST |
| SYS-FUNC-006 | The system MUST allow any authenticated user to view the list of active committees and their members. | MUST |
| SYS-FUNC-007 | The system MUST prevent duplicate committee membership (same user + same committee). | MUST |
| SYS-FUNC-008 | The system SHOULD display the committee chair prominently in committee listings. | SHOULD |
| SYS-FUNC-009 | The system MUST record an audit log entry for every committee create, update, membership add, and membership remove action. | MUST |

### 6.2 Approval Workflow Engine (Generic)

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-FUNC-010 | The workflow engine MUST support the following statuses: `draft`, `submitted`, `under_review`, `approved`, `denied`, `withdrawn`, `appealed`, `appeal_under_review`, `appeal_approved`, `appeal_denied`, `expired`. | MUST |
| SYS-FUNC-011 | The workflow engine MUST enforce a defined state machine -- only valid transitions are permitted (see Section 6.2.1). | MUST |
| SYS-FUNC-012 | The workflow engine MUST associate each workflow instance with exactly one committee. | MUST |
| SYS-FUNC-013 | The workflow engine MUST allow committee members (and admins) to add review comments to a workflow instance. | MUST |
| SYS-FUNC-014 | The workflow engine MUST allow file attachments on a workflow instance, both by the submitter and by reviewers. | MUST |
| SYS-FUNC-015 | The workflow engine MUST record the user who performed each status transition, with a timestamp and optional comment. | MUST |
| SYS-FUNC-016 | The workflow engine MUST support an optional expiration date on approved requests. When set, the system MUST transition the request to `expired` after the expiration date. | MUST |
| SYS-FUNC-017 | The workflow engine MUST support a per-committee configurable default expiration duration (in days) via the `approval_expiration_days` column on the `committees` table. The reviewer MAY override per-request at decision time. | MUST |
| SYS-FUNC-018 | The workflow engine MUST allow the submitter to withdraw a request that is in `submitted` or `under_review` status. | MUST |
| SYS-FUNC-019* | The workflow engine MUST emit notifications (via email service) on the following transitions: submitted, approved, denied, comment-added, appeal-filed, appeal-resolved. | MUST |
| SYS-FUNC-020 | The workflow engine MUST record an audit log entry for every status transition. | MUST |
| SYS-FUNC-021 | The workflow engine MUST support a single appeal on a denied request. The appeal transitions the request to `appealed` and then `appeal_under_review`. | MUST |
| SYS-FUNC-022 | The workflow engine MUST NOT allow more than one appeal per request. | MUST |
| SYS-FUNC-023 | The workflow engine MUST store a polymorphic reference to the domain-specific request (request_type + request_id) to remain domain-agnostic. | MUST |

#### 6.2.1 State Machine

```
draft --> submitted --> under_review --> approved ---------> expired
                    \                \-> denied --> appealed --> appeal_under_review --> appeal_approved --> expired
                     \                                                              \-> appeal_denied
                      \-> withdrawn (from submitted or under_review)
```

Valid transitions:

| From | To | Who May Trigger |
|------|----|-----------------|
| draft | submitted | Submitter |
| submitted | under_review | Committee member |
| submitted | withdrawn | Submitter |
| under_review | approved | Committee member |
| under_review | denied | Committee member |
| under_review | withdrawn | Submitter |
| denied | appealed | Submitter |
| appealed | appeal_under_review | Committee member |
| appeal_under_review | appeal_approved | Committee member |
| appeal_under_review | appeal_denied | Committee member |
| approved | expired | System (automated) |
| appeal_approved | expired | System (automated) |

### 6.3 ARC Request Type (Domain-Specific)

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-FUNC-024 | The system MUST allow authenticated members to create an ARC request with: property address, category (dropdown), description (free text). | MUST |
| SYS-FUNC-025 | The system MUST provide the following ARC categories at minimum: Fence, Paint/Exterior Color, Landscaping, Roofing, Deck/Patio, Shed/Outbuilding, Solar Panels, Signage, Other. | MUST |
| SYS-FUNC-026 | The ARC categories SHOULD be admin-configurable via a database table rather than hard-coded. | SHOULD |
| SYS-FUNC-027 | The system MUST allow the submitter to attach supporting files (photos, plans, PDFs) to the ARC request. Maximum 5 files, 10MB each. | MUST |
| SYS-FUNC-028 | The property address on the ARC request MUST be a free-text field on the request itself, NOT derived from the User model. | MUST |
| SYS-FUNC-029 | The system MUST automatically create a workflow instance and associate it with the ARC committee when an ARC request is created. | MUST |
| SYS-FUNC-030 | The system MUST allow the submitter to view all of their own ARC requests and their current status. | MUST |
| SYS-FUNC-031 | The system MUST allow committee members assigned to the ARC committee to view all ARC requests assigned to their committee. | MUST |
| SYS-FUNC-032 | The system MUST allow admins to view all ARC requests regardless of committee assignment. | MUST |
| SYS-FUNC-033 | The system MUST display a detail view for an ARC request showing: request data, all attachments, workflow status timeline, all comments. | MUST |

---

## 7. Non-Functional Requirements

### 7.1 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-SEC-001 | All committee and workflow endpoints MUST require JWT authentication (except: none are public). | MUST |
| SYS-SEC-002 | Committee management endpoints (create, update, membership) MUST be restricted to admin role. | MUST |
| SYS-SEC-003 | Workflow review actions (status transitions except submit/withdraw/appeal) MUST be restricted to **explicitly appointed committee members** of the assigned committee. Admin role alone does NOT grant review authority. | MUST |
| SYS-SEC-004 | A committee member middleware MUST verify that the authenticated user has an explicit `committee_members` record for the committee associated with the workflow instance before allowing review actions. No admin bypass. | MUST |
| SYS-SEC-005 | File uploads MUST be validated for allowed MIME types and size limits, reusing the existing upload middleware configuration. | MUST |
| SYS-SEC-006 | All user-provided text fields (description, comments) MUST be sanitized to prevent XSS. | MUST |
| SYS-SEC-007* | Request detail views MUST enforce authorization: submitters see only their own requests; committee members see requests assigned to their committee; admins see all. | MUST |

### 7.2 Privacy

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-PRIV-001 | Property addresses on ARC requests MUST NOT be exposed to users who do not have access to the request (submitter, committee members, admins). | MUST |
| SYS-PRIV-002 | Committee member email addresses MUST NOT be exposed through committee listing endpoints. | MUST |

### 7.3 Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-PERF-001 | Request list endpoints MUST support pagination (default 20 items per page) and respond within 500ms for up to 1000 requests. | MUST |
| SYS-PERF-002 | File upload endpoints MUST accept files up to 10MB within 30 seconds on a standard connection. | MUST |

### 7.4 Reliability

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-REL-001 | All workflow status transitions MUST be performed within a database transaction to prevent partial state changes. | MUST |
| SYS-REL-002 | Email notification failures MUST NOT block or rollback workflow status transitions. Failures MUST be logged. | MUST |

### 7.5 Data

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-DATA-001 | All new tables MUST be created via Sequelize migrations (not sync). | MUST |
| SYS-DATA-002 | Workflow history (status transitions, comments) MUST be append-only and immutable. | MUST |
| SYS-DATA-003 | Soft-deleted committees MUST retain all associated workflow data for historical reference. | MUST |

### 7.6 Maintainability

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-MAINT-001 | The workflow engine MUST be implemented as a standalone service module (`workflow.service.js`) decoupled from any specific request type. | MUST |
| SYS-MAINT-002 | Adding a new request type that uses the workflow engine SHOULD require only: (a) a new domain model, (b) new routes/controller, (c) registration with the workflow engine via the polymorphic reference. No changes to the workflow engine itself. | SHOULD |
| SYS-MAINT-003 | All new code MUST follow existing project conventions: Sequelize models in `backend/models/`, services in `backend/src/services/`, controllers in `backend/src/controllers/`, routes in `backend/src/routes/`. | MUST |

### 7.7 Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| SYS-OPS-001 | A Sequelize migration MUST be provided for all new tables and MUST be reversible (up/down). | MUST |
| SYS-OPS-002 | A seed script SHOULD be provided that creates the default "Architectural Review" committee and default ARC categories. | SHOULD |

---

## 8. Data Model

### 8.1 New Tables

#### `committees`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| name | STRING(100) | NOT NULL, UNIQUE | e.g., "Architectural Review" |
| description | TEXT | NULLABLE | |
| status | STRING(20) | NOT NULL, DEFAULT 'active' | 'active' or 'inactive' |
| approval_expiration_days | INTEGER | NOT NULL, DEFAULT 365 | Per-committee default expiration for approved requests (days). 0 = no expiration. |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `committee_members`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| committee_id | INTEGER | FK -> committees.id, NOT NULL | |
| user_id | INTEGER | FK -> users.id, NOT NULL | |
| role | STRING(20) | NOT NULL, DEFAULT 'member' | 'member' or 'chair' |
| appointed_at | DATETIME | NOT NULL | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |
| | | UNIQUE(committee_id, user_id) | Prevents duplicates |

#### `workflow_instances`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| committee_id | INTEGER | FK -> committees.id, NOT NULL | Assigned committee |
| request_type | STRING(50) | NOT NULL | Polymorphic discriminator, e.g., 'arc_request' |
| request_id | INTEGER | NOT NULL | FK to domain-specific table |
| status | STRING(30) | NOT NULL, DEFAULT 'draft' | Current state |
| submitted_by | INTEGER | FK -> users.id, NOT NULL | Original submitter |
| expires_at | DATETIME | NULLABLE | Optional expiration |
| appeal_count | INTEGER | NOT NULL, DEFAULT 0 | Max 1 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |
| | | INDEX(request_type, request_id) | Polymorphic lookup |
| | | INDEX(committee_id, status) | Committee queue |
| | | INDEX(submitted_by) | User's requests |

#### `workflow_transitions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| workflow_id | INTEGER | FK -> workflow_instances.id, NOT NULL | |
| from_status | STRING(30) | NOT NULL | |
| to_status | STRING(30) | NOT NULL | |
| performed_by | INTEGER | FK -> users.id, NOT NULL | |
| comment | TEXT | NULLABLE | Optional reason/note |
| created_at | DATETIME | NOT NULL | Immutable timestamp |

#### `workflow_comments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| workflow_id | INTEGER | FK -> workflow_instances.id, NOT NULL | |
| user_id | INTEGER | FK -> users.id, NOT NULL | |
| content | TEXT | NOT NULL | Sanitized |
| is_internal | BOOLEAN | NOT NULL, DEFAULT false | Internal = committee-only visibility |
| created_at | DATETIME | NOT NULL | |

#### `workflow_attachments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| workflow_id | INTEGER | FK -> workflow_instances.id, NOT NULL | |
| uploaded_by | INTEGER | FK -> users.id, NOT NULL | |
| file_name | STRING | NOT NULL | Stored unique name |
| original_file_name | STRING | NOT NULL | User-facing name |
| file_path | STRING | NOT NULL | Server path |
| mime_type | STRING(100) | NOT NULL | |
| file_size | INTEGER | NOT NULL | Bytes |
| created_at | DATETIME | NOT NULL | |

#### `arc_requests`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| submitter_id | INTEGER | FK -> users.id, NOT NULL | |
| property_address | STRING(255) | NOT NULL | Free-text, on the request |
| category_id | INTEGER | FK -> arc_categories.id, NOT NULL | |
| description | TEXT | NOT NULL | Sanitized |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `arc_categories`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO_INCREMENT | |
| name | STRING(100) | NOT NULL, UNIQUE | |
| description | TEXT | NULLABLE | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 8.2 Relationships

```
User 1--* CommitteeMember *--1 Committee
User 1--* WorkflowInstance (submitted_by)
Committee 1--* WorkflowInstance
WorkflowInstance 1--* WorkflowTransition
WorkflowInstance 1--* WorkflowComment
WorkflowInstance 1--* WorkflowAttachment
WorkflowInstance *--1 ArcRequest (polymorphic via request_type + request_id)
ArcRequest *--1 ArcCategory
ArcRequest *--1 User (submitter_id)
```

### 8.3 Config Table Entries

| Key | Default Value | Description |
|-----|---------------|-------------|
| `arc_default_committee_id` | (set by seed) | ID of the default ARC committee. |

> **Note:** Expiration duration is configured per-committee via `committees.approval_expiration_days`, not in the global Config table.

---

## 9. API Endpoints

### 9.1 Committee Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/committees` | verifyToken | member, admin | List all active committees |
| GET | `/api/committees/:id` | verifyToken | member, admin | Get committee detail with members |
| POST | `/api/committees` | verifyToken | admin | Create committee |
| PUT | `/api/committees/:id` | verifyToken | admin | Update committee |
| DELETE | `/api/committees/:id` | verifyToken | admin | Deactivate committee |
| POST | `/api/committees/:id/members` | verifyToken | admin | Add member to committee |
| DELETE | `/api/committees/:id/members/:userId` | verifyToken | admin | Remove member from committee |

### 9.2 Workflow Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/workflows` | verifyToken | member, admin | List workflow instances (filtered by role: own, committee, or all) |
| GET | `/api/workflows/:id` | verifyToken | member, admin | Get workflow detail (transitions, comments, attachments) |
| POST | `/api/workflows/:id/transitions` | verifyToken | varies | Perform status transition |
| POST | `/api/workflows/:id/comments` | verifyToken | varies | Add comment |
| POST | `/api/workflows/:id/attachments` | verifyToken | varies | Upload attachment |
| GET | `/api/workflows/:id/attachments/:attachmentId/download` | verifyToken | varies | Download attachment |

### 9.3 ARC Request Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/arc-requests` | verifyToken | member, admin | List ARC requests (own for member, all for admin, committee for committee member) |
| GET | `/api/arc-requests/:id` | verifyToken | member, admin | Get ARC request detail (includes workflow data) |
| POST | `/api/arc-requests` | verifyToken | member, admin | Create ARC request (auto-creates workflow instance) |
| PUT | `/api/arc-requests/:id` | verifyToken | submitter only | Update ARC request (only while in draft status) |

### 9.4 ARC Category Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/arc-categories` | verifyToken | member, admin | List active categories |
| POST | `/api/arc-categories` | verifyToken | admin | Create category |
| PUT | `/api/arc-categories/:id` | verifyToken | admin | Update category |
| DELETE | `/api/arc-categories/:id` | verifyToken | admin | Deactivate category |

---

## 10. Role & Permission Model

### 10.1 Existing Roles (Unchanged)

- **member**: Authenticated HOA resident
- **admin**: System administrator

### 10.2 New Authorization Layer: Committee Membership

Committee membership is NOT a new role in the JWT. It is a data-driven authorization check:

```
isCommitteeMember(userId, committeeId) -> boolean
isCommitteeChair(userId, committeeId) -> boolean
```

### 10.3 Permission Matrix

| Action | Member | Committee Member | Committee Chair | Admin (not on committee) |
|--------|--------|-----------------|-----------------|-------------------------|
| Create ARC request | Yes | Yes | Yes | Yes |
| View own requests | Yes | Yes | Yes | Yes |
| View committee requests | No | Yes (own committee) | Yes (own committee) | Yes (all, read-only) |
| Transition: submit | Submitter | Submitter | Submitter | Submitter |
| Transition: begin review | No | Yes | Yes | **No** |
| Transition: approve/deny | No | Yes | Yes | **No** |
| Transition: withdraw | Submitter | Submitter | Submitter | Submitter |
| Transition: appeal | Submitter | Submitter | Submitter | Submitter |
| Add comment | Submitter | Yes | Yes | **No** |
| Add internal comment | No | Yes | Yes | **No** |
| Upload attachment | Submitter | Yes | Yes | **No** |
| Manage committees | No | No | No | Yes |
| Manage categories | No | No | No | Yes |

> **Note:** Admins who need to participate in reviews must be explicitly appointed to the committee. They may appoint themselves.

---

## 11. Email Notification Triggers

| Event | Recipients | Template Name |
|-------|-----------|---------------|
| ARC request submitted | Committee members of assigned committee | `arc-request-submitted` |
| Request moved to under_review | Submitter | `workflow-status-changed` |
| Request approved | Submitter | `workflow-status-changed` |
| Request denied | Submitter | `workflow-status-changed` |
| Comment added by committee | Submitter | `workflow-comment-added` |
| Comment added by submitter | Committee members | `workflow-comment-added` |
| Appeal filed | Committee members of assigned committee | `workflow-appeal-filed` |
| Appeal resolved | Submitter | `workflow-status-changed` |
| Approval expiring (7 days before) | Submitter | `workflow-expiration-warning` |

---

## 12. Integration with Existing Features

| Existing Feature | Integration |
|------------------|-------------|
| **Auth middleware** | Reuse `verifyToken`, `authorizeRoles`. Add `authorizeCommitteeMember` middleware. |
| **Upload middleware** | Reuse multer config for workflow attachments. Extend allowed types if needed. |
| **Email service** | Add new template functions in `email.service.js`. Follow existing patterns (audit, retry, batch). |
| **Audit logging** | Reuse `AuditLog` model. New action types: `committee_created`, `committee_updated`, `committee_member_added`, `committee_member_removed`, `workflow_transition`, `arc_request_created`. |
| **Documents** | Workflow attachments are stored separately from the Documents table (different use case and access control). |
| **Config table** | Add entries for `arc_default_expiration_days` and `arc_default_committee_id`. |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Workflow engine becomes over-engineered for MVP scope | Delays delivery | Keep the engine minimal: polymorphic reference, state machine, comments, attachments. No dynamic form builder, no complex routing rules. |
| Committee membership authorization adds latency | Slower API responses | Cache committee memberships per request (middleware sets `req.committeeMemberships` once). |
| File storage fills disk on 1GB Linode | Service degradation | Enforce file size limits. Monitor disk usage. Document cleanup procedures. |
| Expiration job has no scheduler | Approvals never expire | In MVP, check expiration on read (lazy evaluation). Add cron job in mvp-mid tier. |

---

## 14. WILL-NOT (MVP Deferrals)

The following capabilities are explicitly deferred from MVP:

| Deferred Capability | Deferred To | Rationale |
|---------------------|-------------|-----------|
| Observability (metrics, tracing, dashboards) | mvp-mid | MVP uses structured logging only |
| Cron-based expiration processing | mvp-mid | MVP uses lazy evaluation on read |
| Multi-committee approval chains (e.g., requires approval from 2 committees) | target | Adds significant complexity |
| Quorum / minimum reviewer count for decisions | mvp-mid | Single reviewer sufficient for ~40 homes |
| Dynamic form fields per category | mvp-mid | All categories use the same form in MVP |
| Bulk operations on requests | target | Low volume does not justify |
| Committee-specific notification preferences | target | All committee members receive all notifications in MVP |
| Public-facing request status portal (no-auth) | target | All views require authentication in MVP |
| Voting/consensus among committee members | mvp-mid | Single committee member can approve/deny in MVP |
| Kubernetes deployment | mvp-mid | Docker-compose-first |
| Request templates / saved drafts | target | Not critical for ~40 homes |

---

## 15. Open Questions

See [open-questions.md](../common/open-questions.md) for the full ledger.

---

## 16. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-03-26 | Requirements Architect | Initial draft |
