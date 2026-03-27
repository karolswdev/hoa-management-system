# Open Questions Ledger

This document tracks unresolved questions, contradictions, and assumptions that require stakeholder confirmation before baseline.

---

## Open

(None -- all questions resolved 2026-03-26)

---

## Resolved

### OQ-001: Committee Chair Permissions vs. Committee Member Permissions
**Status:** Resolved 2026-03-26
**Resolution:** MVP treats chair and member identically for workflow authorization (both can approve/deny). Chair is a display/organizational role only. Revisit for quorum-based voting in mvp-mid.
**Impact:** SYS-FUNC-004, SYS-SEC-003, permission matrix in SRS Section 10.3.

### OQ-002: Multiple Committee Chairs
**Status:** Resolved 2026-03-26
**Resolution:** Allow multiple chairs per committee (co-chairs). No unique constraint on role per committee.
**Impact:** SYS-FUNC-004, `committee_members` schema.

### OQ-003: Who Seeds the Initial ARC Committee?
**Status:** Resolved 2026-03-26
**Resolution:** Seed script creates the "Architectural Review" committee entity during deployment. Admin appoints members via UI post-deployment.
**Impact:** SYS-OPS-002, deployment runbook.

### OQ-004: Draft State Visibility
**Status:** Resolved 2026-03-26
**Resolution:** Drafts are visible only to the submitter. Committee members see requests starting from `submitted` status onward.
**Impact:** SYS-FUNC-030, SYS-FUNC-031, SYS-SEC-007*.

### OQ-005: Expiration Behavior After Appeal Approval
**Status:** Resolved 2026-03-26
**Resolution:** Yes, `appeal_approved` starts its own fresh expiration window from the appeal approval date. **The expiration period is configurable per committee** (e.g., ARC = 90 days, another committee might use 60 days). Each committee stores its own default `approval_expiration_days`. The reviewer can still override per-request at decision time.
**Impact:** SYS-FUNC-016, state machine transitions, `committees` schema (add `approval_expiration_days` column).

### OQ-006: Attachment Limits Per Workflow Instance
**Status:** Resolved 2026-03-26
**Resolution:** 5 files per upload request, 20 total per workflow instance. Sufficient for MVP. Make configurable later.
**Impact:** ICD Section 2.2 (workflow attachment endpoint).

### OQ-007: Admin as Implicit Committee Member
**Status:** Resolved 2026-03-26
**Resolution:** **No implicit bypass.** Admins can manage committees (create, appoint members, remove members) but **cannot review, approve/deny, or comment on requests unless explicitly appointed as a committee member.** Admins may appoint themselves to a committee if needed, but the system does not grant implicit committee membership. This preserves separation of duties.
**Impact:** SYS-SEC-003, `authorizeCommitteeMember` middleware -- must check explicit `committee_members` records, no admin shortcut.

### OQ-008: Notification for Withdrawn Requests
**Status:** Resolved 2026-03-26
**Resolution:** Yes, committee members are notified when a submitter withdraws a request that was already in `submitted` or `under_review` status.
**Impact:** SYS-FUNC-019*, email template list.
