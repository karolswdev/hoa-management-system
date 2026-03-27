# ADR-0005: Lazy Expiration Evaluation (MVP)

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** OPS / PERF
- **Tier:** MVP
- **Linked Requirements:** SYS-FUNC-016

## Context

Approved workflow requests can have an expiration date (`expires_at` on `workflow_instances`). When this date passes, the system must transition the request to `expired` status. The question is how and when this transition occurs.

The system runs on a 1GB Linode with SQLite. There is no job scheduler, message queue, or cron infrastructure in the MVP deployment. The SRS explicitly defers cron-based expiration processing to mvp-mid tier (Section 14, WILL-NOT).

At ~40 homes, the total number of approved requests at any given time is expected to be in the low tens.

## Decision Drivers (Ranked)

1. **Infrastructure simplicity** -- MVP runs Docker Compose on a 1GB Linode. No cron daemon, no Redis, no job queue.
2. **Correctness** -- Expired requests must appear as expired when viewed.
3. **MVP delivery speed** -- Avoid introducing background job infrastructure for a feature that affects a handful of records.
4. **Operational overhead** -- Fewer moving parts means fewer things to monitor and debug.
5. **Future upgradeability** -- The approach should not prevent adding a cron job later.

## Options Considered

### Option A -- Lazy Evaluation on Read (Chosen)

When a workflow instance is fetched (list or detail endpoint), the service checks if `status` is `approved` or `appeal_approved` AND `expires_at` is in the past. If so, the service performs the transition to `expired` inline (within the same request), records the transition in `workflow_transitions` with `performed_by` set to a system user ID, and returns the updated status.

- **Pros:**
  - Zero infrastructure. No cron, no scheduler, no background process.
  - Expired status is always accurate when viewed by a user.
  - Trivial to implement: a few lines in the workflow service's read path.
  - The transition is recorded in `workflow_transitions` like any other transition, preserving the audit trail.
- **Cons:**
  - Expiration does not happen at the exact `expires_at` moment. It happens on next read. If nobody views the request for days after expiration, the transition timestamp will be late.
  - The first reader after expiration pays a slight latency cost for the write (transition record + status update). With SQLite on a small dataset, this is sub-millisecond.
  - Expiration-triggered notifications (e.g., "your approval has expired") are only sent when someone views the request, not at the actual expiration time. The SRS does not require an expiration notification at MVP -- the `workflow-expiration-warning` template is listed as mvp-mid+ in the ICD.
  - Reporting queries that filter by status without going through the service layer may show stale `approved` statuses for expired records. Mitigation: all access goes through the workflow service.

### Option B -- Cron Job / Scheduled Task

A background process runs periodically (e.g., every hour) to check all approved records with `expires_at < NOW()` and transitions them.

- **Pros:**
  - Expiration happens close to the actual `expires_at` time (within the cron interval).
  - Notifications can be sent at expiration time.
  - Read path is purely read -- no write side effects.
- **Cons:**
  - Requires cron infrastructure: either a system cron, a node-cron library, or a separate container.
  - On a 1GB Linode, an additional process increases memory pressure.
  - More operational complexity: monitoring the cron job, handling failures, ensuring exactly-once execution.
  - Explicitly deferred to mvp-mid in the SRS (Section 14).

### Option C -- Database Trigger / Computed Column

Use SQLite triggers or views to automatically mark records as expired.

- **Pros:**
  - Transparent to the application layer.
- **Cons:**
  - SQLite triggers cannot easily fire on time-based conditions (there is no event scheduler).
  - A computed view could return the effective status, but Sequelize does not natively support virtual columns backed by views.
  - Breaks the pattern of all state transitions being recorded in `workflow_transitions`.

## Decision

Adopt **Option A: Lazy Evaluation on Read** for the MVP tier.

The workflow service's list and detail methods will check expiration conditions and perform inline transitions when needed. The transition is recorded with `performed_by: SYSTEM_USER_ID` and `comment: 'Auto-expired'`.

This is explicitly a **MVP-tier decision**. The mvp-mid tier should introduce a cron job (Option B) to handle expiration proactively, enabling timely notifications and accurate reporting.

## Consequences

### Positive
- No additional infrastructure, processes, or monitoring required at MVP.
- The transition audit trail is identical to other transitions -- consistent data model.
- Trivially testable: set `expires_at` in the past, call the endpoint, assert the status changed.

### Negative
- Expiration is not real-time. A request that expires at midnight will not show as expired until someone fetches it.
- Notifications tied to expiration events are deferred to mvp-mid (when the cron job is introduced).
- Any direct database queries or admin tooling that bypasses the service layer will see stale statuses. All access must go through the workflow service.

## Rollback / Exit Strategy

Adding a cron job (Option B) is purely additive. The lazy evaluation code can remain as a safety net (belt-and-suspenders) while the cron handles proactive expiration. No schema changes needed.

## Links

- SRS: SYS-FUNC-016, Section 13 (Risks), Section 14 (WILL-NOT: cron deferred to mvp-mid)
- ICD: Section 6.2 (Transition Map: approved -> expired, appeal_approved -> expired)
- Related ADRs: ADR-0004 (Per-Committee Expiration Configuration)
