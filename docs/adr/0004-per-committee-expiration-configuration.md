# ADR-0004: Per-Committee Expiration Configuration

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** FUNC / DATA
- **Tier:** MVP
- **Linked Requirements:** SYS-FUNC-016, SYS-FUNC-017

## Context

Approved workflow requests can have an optional expiration date. When set, the system transitions the request to `expired` after that date. The question is where to configure the default expiration duration: globally (single system-wide value), or per-committee.

The existing system has a `Config` model/table used for global key-value settings (e.g., `config.service.js`). The SRS specifies a per-committee `approval_expiration_days` column on the `committees` table, with reviewers able to override per-request at decision time.

This was raised as OQ-005 and resolved: each committee stores its own default `approval_expiration_days`. The ARC committee might use 365 days while a future Facilities committee might use 90 days.

## Decision Drivers (Ranked)

1. **Domain appropriateness** -- Different committees govern different types of approvals with different lifespans. A fence approval (ARC) may be valid for a year; a temporary event permit (Social) may be valid for 30 days.
2. **Admin control** -- Admins should be able to configure expiration defaults without modifying a shared global config that affects all committees.
3. **Reviewer override** -- Individual requests may warrant different durations. The per-committee value is a default, not a mandate.
4. **Simplicity** -- The configuration should be discoverable and editable through the existing committee management UI.

## Options Considered

### Option A -- Per-Committee Configuration (Chosen)

The `committees` table includes an `approval_expiration_days` column (INTEGER, NOT NULL, DEFAULT 365). When a reviewer approves a request, the system calculates `expires_at` from this value unless the reviewer specifies an override. A value of 0 means no expiration.

- **Pros:**
  - Each committee has its own sensible default. No cross-committee interference.
  - Configuration lives alongside the committee entity -- no need to navigate to a separate settings page.
  - Reviewers can still override per-request for edge cases.
  - Simple schema: one column on an existing table.
- **Cons:**
  - If an HOA wants a single global default, they must set the same value on every committee manually. In practice, with ~40 homes and few committees, this is trivial.

### Option B -- Global Configuration Only

A single `approval_expiration_days` entry in the `Config` table applies to all committees.

- **Pros:**
  - Single point of configuration. Change once, applies everywhere.
- **Cons:**
  - Cannot differentiate between committee types. ARC approvals and event permits would share the same expiration window.
  - Reviewers would need to override more frequently, since the global default cannot be appropriate for all types.
  - When new committee types are added (target tier), the global default becomes increasingly inappropriate.

### Option C -- Both Global and Per-Committee (Cascading)

Global default in Config, overridable per-committee, overridable per-request.

- **Pros:**
  - Maximum flexibility. Three-level cascade.
- **Cons:**
  - Over-engineered for MVP. With 1-2 committees, the cascade adds confusion about which value applies.
  - More code to resolve the cascade (check request -> check committee -> check global).
  - The global fallback is only useful if committees can have NULL expiration, which complicates the schema.

## Decision

Adopt **Option A: Per-Committee Configuration**.

The `committees` table includes `approval_expiration_days` (INTEGER, NOT NULL, DEFAULT 365). When a reviewer approves or appeal-approves a request:

1. If the reviewer provides an explicit expiration override, use it.
2. Otherwise, compute `expires_at = NOW() + committee.approval_expiration_days` days.
3. If `approval_expiration_days` is 0, set `expires_at` to NULL (no expiration).

## Consequences

### Positive
- Each committee has a contextually appropriate default without affecting others.
- The configuration is visible and editable on the committee management page -- no separate settings screen needed.
- The three-value resolution (reviewer override > committee default > no expiration if 0) is simple and predictable.

### Negative
- No global fallback. If an admin creates a new committee and forgets to set the expiration, the default of 365 days applies. This is a safe default.

## Rollback / Exit Strategy

Adding a global fallback later (Option C) is additive: add a `Config` entry and modify the resolution logic to check it when the committee value is not set. No breaking changes.

## Links

- SRS: SYS-FUNC-016, SYS-FUNC-017, Section 8.1 (committees schema)
- Open Questions: OQ-005 (resolved)
- Related ADRs: ADR-0005 (Lazy Expiration Evaluation)
