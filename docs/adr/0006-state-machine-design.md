# ADR-0006: Workflow State Machine Design (11 Statuses, Single-Level Appeal)

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** FUNC
- **Tier:** MVP
- **Linked Requirements:** SYS-FUNC-010, SYS-FUNC-011, SYS-FUNC-018, SYS-FUNC-021, SYS-FUNC-022

## Context

The approval workflow engine requires a state machine to govern request lifecycle. The SRS defines 11 statuses with strict transitions enforced at the application layer. Key design questions include:

- Why 11 statuses and not fewer (e.g., collapsing appeal states)?
- Why single-level appeal only (no appeal-of-appeal)?
- Why explicit `under_review` and `appeal_under_review` states instead of jumping directly from `submitted` to `approved/denied`?

The state machine is defined in the ICD (Section 6) and must be domain-agnostic -- it applies equally to ARC requests and any future request types.

## Decision Drivers (Ranked)

1. **Process transparency** -- Residents should be able to see exactly where their request is in the review process. Intermediate states (under_review) provide meaningful status updates.
2. **Audit completeness** -- Each transition is recorded. More granular states produce a richer audit trail.
3. **Governance simplicity** -- Single-level appeal is sufficient for a ~40-home HOA. Multi-level appeal adds complexity without proportional value.
4. **Domain agnosticism** -- The state machine must work for any request type, not just ARC.
5. **Implementability** -- The state machine must be simple enough to implement as a lookup table, not a workflow engine framework.

## Options Considered

### Option A -- 11-Status State Machine with Single-Level Appeal (Chosen)

States: `draft`, `submitted`, `under_review`, `approved`, `denied`, `withdrawn`, `appealed`, `appeal_under_review`, `appeal_approved`, `appeal_denied`, `expired`.

```
draft -> submitted -> under_review -> approved -> expired
                   \              \-> denied -> appealed -> appeal_under_review -> appeal_approved -> expired
                    \                                                           \-> appeal_denied
                     \-> withdrawn
```

- **Pros:**
  - `draft` allows residents to save incomplete requests before submitting. Aligns with the `submitImmediately` flag in the ICD.
  - `under_review` signals to the resident that a committee member has picked up their request. This is meaningful feedback.
  - Separate `appealed` and `appeal_under_review` states mirror the original flow, maintaining symmetry and transparency.
  - `withdrawn` is a terminal state accessible from `submitted` and `under_review`, giving submitters an escape hatch before a decision is made.
  - `expired` is a system-driven terminal state for time-limited approvals.
  - Single-level appeal prevents infinite loops. One appeal is standard practice for HOA governance.
  - The entire state machine fits in a simple lookup map (13 transitions, as defined in the ICD Section 6.2).
- **Cons:**
  - 11 statuses is more than a minimal approve/deny workflow. Each status must be handled in the UI.
  - Appeal states duplicate the review flow (appealed -> appeal_under_review -> appeal_approved/denied mirrors submitted -> under_review -> approved/denied).

### Option B -- Simplified 6-Status Machine (No Intermediate Review States)

States: `draft`, `submitted`, `approved`, `denied`, `withdrawn`, `expired`. No `under_review` or appeal states. Appeals are handled by resubmitting.

- **Pros:**
  - Fewer states, simpler UI.
  - No appeal-specific logic.
- **Cons:**
  - No visibility into whether a request is being actively reviewed.
  - No formal appeal process. Resubmission loses the connection to the original denial, making audit trails incomplete.
  - Does not satisfy SYS-FUNC-021 (single appeal support).
  - Residents cannot distinguish between "waiting in queue" and "actively under review."

### Option C -- Multi-Level Appeal (Unlimited or N-Level)

Same as Option A but allow appeals of appeal denials (appeal -> appeal of appeal -> ...).

- **Pros:**
  - Maximum recourse for residents.
- **Cons:**
  - Creates potential for infinite loops or protracted disputes.
  - Significantly more states or a recursive state pattern.
  - For a ~40-home HOA, escalation beyond one appeal can be handled out-of-band (board meeting, mediation).
  - Violates SYS-FUNC-022 (max one appeal per request).
  - Over-engineered for the community size and governance model.

## Decision

Adopt **Option A: 11-Status State Machine with Single-Level Appeal**.

The state machine is implemented as a constant lookup map in the workflow service:

- **VALID_TRANSITIONS**: Maps each status to its allowed next statuses.
- **TRANSITION_AUTH**: Maps each `from->to` pair to the user relations authorized to trigger it (`submitter`, `committee_member`, `system`).

The `appeal_count` column on `workflow_instances` (max value: 1) enforces the single-appeal constraint at the data level. The `transitionWorkflow` function validates both the transition and the authorization before executing.

### Rationale for Specific States

| Status | Why It Exists |
|--------|---------------|
| `draft` | Allows save-before-submit. Supports the `submitImmediately` flag for streamlined submission. Only visible to submitter (OQ-004). |
| `submitted` | Request is in the committee's queue but not yet picked up. Distinct from `under_review`. |
| `under_review` | A committee member has begun reviewing. Provides meaningful feedback to the resident. |
| `approved` / `denied` | Standard decision outcomes. |
| `withdrawn` | Submitter-initiated cancellation. Terminal state. Allowed from `submitted` and `under_review` only (not after a decision). |
| `appealed` | Submitter has contested a denial. Distinct from `submitted` to preserve the appeal context. |
| `appeal_under_review` | Mirrors `under_review` for the appeal flow. Same transparency benefit. |
| `appeal_approved` / `appeal_denied` | Terminal decision on the appeal. |
| `expired` | System-driven. Approval is no longer valid after the configured duration. |

## Consequences

### Positive
- Residents have full visibility into request progress at every stage.
- The audit trail captures every meaningful state change.
- Single-level appeal is enforceable via `appeal_count` with no recursive complexity.
- The state machine is a data structure, not a framework -- easy to test, easy to reason about.

### Negative
- The frontend must handle 11 statuses in status badges, filters, and detail views. This is a UI effort but not a complexity burden -- each status maps to a color and label.
- The appeal flow duplicates the review flow structurally. This is intentional (symmetry aids comprehension) but adds 4 states that only apply when an appeal occurs.

## Rollback / Exit Strategy

States can be added to the state machine without breaking existing data (additive change). Removing states requires migrating existing records out of the removed status, which is more involved. The chosen set is deliberately conservative -- it can be extended but should not need reduction.

If multi-level appeal is ever needed (target tier), the `appeal_count` cap can be raised and new states added. The existing single-appeal data remains valid.

## Links

- SRS: SYS-FUNC-010, SYS-FUNC-011, Section 6.2.1 (State Machine diagram and transition table)
- ICD: Section 6 (Status Enum, Transition Map, Transition Authorization)
- Open Questions: OQ-004 (draft visibility resolved)
- Related ADRs: ADR-0002 (Polymorphic Workflow Engine), ADR-0005 (Lazy Expiration)
