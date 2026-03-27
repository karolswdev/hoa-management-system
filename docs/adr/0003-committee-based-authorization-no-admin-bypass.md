# ADR-0003: Committee-Based Authorization with No Admin Bypass

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** SEC
- **Tier:** MVP
- **Linked Requirements:** SYS-SEC-003, SYS-SEC-004, SYS-SEC-007*

## Context

The existing HOA Management System has two JWT roles: `member` and `admin`. Admins have full control over system administration (user management, announcements, documents, etc.). The new committee and workflow features introduce a third authorization dimension: **committee membership**.

The critical design question is whether admins should implicitly have review/approve/deny authority on all workflow requests by virtue of their admin role, or whether review authority should require explicit committee appointment.

This was raised as OQ-007 and resolved: **No implicit bypass.** Admins manage committees but cannot review, approve, deny, or comment on requests unless explicitly appointed as committee members. Admins may appoint themselves if needed.

The existing `authorizeRoles('admin')` middleware pattern allows role-based gating. The new feature requires a data-driven authorization check against the `committee_members` table.

## Decision Drivers (Ranked)

1. **Separation of duties** -- System administration and committee review are distinct responsibilities. An admin who manages user accounts should not automatically have authority to approve property modifications.
2. **Auditability** -- Every review action traces to an explicitly appointed committee member. The audit trail is unambiguous.
3. **Real-world HOA governance** -- In practice, HOA boards appoint specific residents to committees. Board members (admins) are not automatically on every committee.
4. **Self-service escape hatch** -- Admins can appoint themselves, so there is no hard lockout. The requirement is explicit action, not prohibition.
5. **Existing auth patterns** -- The codebase uses `verifyToken` + `authorizeRoles`. The new check layers on top without replacing existing patterns.

## Options Considered

### Option A -- Explicit Committee Membership Required (Chosen)

A new `authorizeCommitteeMember` middleware checks the `committee_members` table for an explicit record linking the authenticated user to the committee associated with the workflow instance. Admin role alone does not satisfy this check.

- **Pros:**
  - Clean separation of duties. System administration and committee review are decoupled.
  - Audit log entries for review actions always point to an explicitly appointed member.
  - Matches real-world HOA governance where committee appointments are deliberate.
  - Admins retain full control: they can appoint themselves at any time.
- **Cons:**
  - Admins may find it inconvenient to appoint themselves before reviewing a request.
  - Requires a new middleware and per-request database lookup (mitigated by caching committee memberships on the request object, as noted in SRS Section 13).

### Option B -- Admin Implicit Bypass

Admins can review, approve, deny, and comment on any workflow request without being appointed to the committee.

- **Pros:**
  - Simpler authorization logic. Existing `authorizeRoles('admin')` covers review actions.
  - No self-appointment step needed.
- **Cons:**
  - Violates separation of duties. An admin who manages the system could approve their own ARC request without any committee oversight.
  - Audit trail is ambiguous: was the admin acting as a system administrator or as a committee reviewer?
  - Does not reflect real-world HOA governance.
  - Explicitly rejected by stakeholder decision (OQ-007).

### Option C -- Hybrid (Admin Can View but Not Act)

Admins can view all requests (read-only) but cannot perform review actions unless appointed.

- **Pros:**
  - Admins have visibility for oversight without review authority.
- **Cons:**
  - The SRS already specifies this: admins can view all requests (SYS-FUNC-032) but the permission matrix (Section 10.3) already restricts transitions to committee members. This is not a distinct option -- it is the view-layer behavior of Option A.

## Decision

Adopt **Option A: Explicit Committee Membership Required**.

A new `authorizeCommitteeMember` middleware will:

1. Resolve the `committee_id` from the workflow instance associated with the request.
2. Query `committee_members` for a record matching `(user_id, committee_id)`.
3. Reject with 403 if no record exists, regardless of the user's JWT role.
4. Cache the membership check result on `req.committeeMemberships` to avoid repeated queries within the same request.

Admin-only operations (committee CRUD, member appointment/removal, category management) continue to use the existing `authorizeRoles('admin')` middleware.

Read-only access for admins (viewing all requests) is handled at the query/service layer, not the committee membership middleware.

## Consequences

### Positive
- Separation of duties is enforced at the middleware level. No code path allows an unappointed admin to perform review actions.
- Audit log entries for workflow transitions are always attributable to an explicitly appointed committee member.
- The pattern extends cleanly to future committees (Finance, Social, etc.) where different admins may or may not be members.

### Negative
- First-time setup requires an admin to appoint themselves (or others) to the ARC committee after the seed script creates it. This is a one-time operational step documented in the deployment runbook.
- Each review action incurs a `committee_members` lookup. At ~40 homes, this is a negligible cost. The per-request cache (`req.committeeMemberships`) prevents redundant queries within a single HTTP request.

## Rollback / Exit Strategy

If stakeholders later decide admins should have implicit review authority, the `authorizeCommitteeMember` middleware can be updated to include an admin bypass check. No schema changes are required. The `committee_members` table remains the same; only the middleware logic changes. This is fully reversible.

## Links

- SRS: SYS-SEC-003, SYS-SEC-004, Section 10.3 (Permission Matrix)
- ICD: Section 3.2 (`isCommitteeMember`, `isCommitteeChair`)
- Open Questions: OQ-007 (resolved)
- Related ADRs: ADR-0001 (Three-Layer Decomposition)
