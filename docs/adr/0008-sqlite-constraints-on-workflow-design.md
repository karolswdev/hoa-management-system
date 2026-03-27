# ADR-0008: SQLite Constraints and Their Impact on Workflow Engine Design

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** DATA / PERF / REL
- **Tier:** MVP
- **Linked Requirements:** SYS-PERF-001, SYS-REL-001, SYS-DATA-001, SYS-DATA-002

## Context

The HOA Management System runs on a 1GB Linode with SQLite3 as its database. SQLite is an embedded, file-based database with specific characteristics that differ from client-server databases (PostgreSQL, MySQL). The workflow engine introduces transactional state transitions, concurrent read/write patterns, and polymorphic references that interact with SQLite's capabilities and limitations.

The existing system already operates successfully on SQLite (user management, documents, discussions, polls, events, vendor directory, board governance). The workflow engine adds:

- Transactional multi-table writes (workflow status update + transition record + audit log, within a single transaction per SYS-REL-001).
- Concurrent access from multiple committee members reviewing requests simultaneously.
- Polymorphic references without database-level FK enforcement (see ADR-0002).
- Append-only history tables (workflow_transitions, workflow_comments) that grow over time.

At ~40 homes, the expected data volume is low: tens of active requests, hundreds of transitions and comments over a year.

## Decision Drivers (Ranked)

1. **Operational simplicity** -- SQLite requires no separate database server, no connection pooling, no backup orchestration beyond file copies. This is critical for a 1GB Linode.
2. **Existing investment** -- The entire codebase uses Sequelize with SQLite. Switching databases is a major effort.
3. **Transactional safety** -- Workflow state transitions must be atomic (SYS-REL-001).
4. **Concurrency** -- Multiple committee members and residents may interact with the system simultaneously.
5. **Data volume** -- ~40 homes produces low volume. SQLite's limitations at scale are not relevant here.

## SQLite Characteristics Relevant to the Workflow Engine

| Characteristic | Impact | Mitigation |
|---|---|---|
| **Single-writer concurrency** | SQLite uses file-level locking. Only one write transaction at a time. Concurrent writes queue. | At ~40 homes, write contention is negligible. Workflow transitions are fast (sub-10ms). WAL mode (already likely in use) allows concurrent reads during writes. |
| **No conditional foreign keys** | Cannot enforce `workflow_instances.request_id -> arc_requests.id` only when `request_type = 'arc_request'`. | Application-layer enforcement (ADR-0002). Domain services create workflow instances within transactions. |
| **Transaction support** | Full ACID transactions supported. Sequelize `transaction` option works with SQLite. | `transitionWorkflow` wraps status update + transition record + audit log in a single Sequelize transaction. |
| **No native ENUM type** | `status` and `role` columns are strings, not constrained at the DB level. | Application-layer validation via the state machine map and Sequelize model validators. |
| **No scheduled events** | No built-in event scheduler or cron. | Lazy expiration evaluation (ADR-0005). |
| **File-based storage** | Database file grows on disk. On a 1GB Linode, disk is shared with the OS, application, uploads, and logs. | At ~40 homes, database growth is negligible (KBs per year for workflow data). File uploads are the real disk concern, mitigated by per-file size limits (10MB) and per-workflow attachment limits (20 files). |
| **No partial indexes** | Cannot create an index on `workflow_instances WHERE status = 'approved'`. | Standard composite indexes `(committee_id, status)` and `(submitted_by)` are sufficient at this scale. |
| **Integer primary keys** | SQLite auto-increment is reliable for the expected volume. | No special handling needed. |

## Options Considered

### Option A -- Continue with SQLite, Design Around Its Constraints (Chosen)

Accept SQLite's limitations and design the workflow engine to work within them. Use application-layer enforcement where database-level constraints are not possible.

- **Pros:**
  - No infrastructure changes. No migration effort.
  - Operational simplicity preserved. Backups remain file copies.
  - The data volume (~40 homes) is well within SQLite's comfortable range.
  - All existing Sequelize models and migrations continue to work.
  - Memory footprint stays minimal on the 1GB Linode.
- **Cons:**
  - Polymorphic FK integrity is not database-enforced (accepted in ADR-0002).
  - If the HOA grows significantly (hundreds of homes, multiple active committees), write contention could become noticeable. This is a future concern, not an MVP concern.
  - Enum-like constraints are application-level only.

### Option B -- Migrate to PostgreSQL

Switch the database to PostgreSQL for stronger typing, real ENUMs, partial indexes, conditional FKs (via triggers), and superior concurrency.

- **Pros:**
  - Database-level enforcement of enums, polymorphic FKs (via triggers), and conditional indexes.
  - Better concurrency model (row-level locking vs. file-level).
  - Richer query capabilities (JSONB, CTEs, window functions).
- **Cons:**
  - Requires a separate database server process, consuming memory on the 1GB Linode (PostgreSQL typically wants 256MB+).
  - All existing migrations must be tested/adapted for PostgreSQL dialect differences.
  - Operational complexity increases: connection pooling, backup/restore procedures, monitoring.
  - Massive effort for marginal benefit at ~40 homes.
  - Explicitly contrary to the project's operational model.

### Option C -- SQLite for Now, Plan Migration Trigger

Stay on SQLite with documented criteria for when to migrate (e.g., >200 homes, >5 concurrent committees, measurable write contention).

- **Pros:**
  - Same as Option A, but with explicit guardrails for future evaluation.
- **Cons:**
  - Same as Option A. The guardrails are useful but do not change the current decision.

## Decision

Adopt **Option A: Continue with SQLite**, with the following design guidelines for the workflow engine:

1. **Transactions**: All workflow state transitions use Sequelize's `transaction` option to wrap status update + transition record + audit log in a single atomic operation. SQLite's transaction support is fully adequate for this.

2. **Referential integrity**: Polymorphic FKs are enforced at the application layer (ADR-0002). Standard FKs (committee_members -> committees, workflow_instances -> committees, etc.) use Sequelize's built-in FK support with SQLite's `PRAGMA foreign_keys = ON`.

3. **Indexes**: Composite indexes on `(request_type, request_id)`, `(committee_id, status)`, and `(submitted_by)` are defined in migrations. At this data volume, these indexes are more than sufficient.

4. **Concurrency**: WAL mode should be enabled (if not already) to allow concurrent readers during writes. Write transactions should be kept as short as possible.

5. **Validation**: Status enums and role enums are validated at the Sequelize model level and in the state machine lookup map, not via database constraints.

6. **Disk monitoring**: File uploads (not database growth) are the primary disk consumption risk. The existing upload size limits (10MB per file, 20 files per workflow) cap the worst case at 200MB per workflow instance, which is manageable but should be monitored.

## Consequences

### Positive
- Zero infrastructure changes. The workflow engine slots into the existing stack.
- Operational simplicity preserved. No new services to monitor or maintain.
- Sequelize abstracts most SQLite-specific concerns. The code is portable if a migration is ever needed.

### Negative
- Some constraints that would be database-enforced in PostgreSQL are application-enforced instead. Developers must be disciplined about using the service layer for all data access.
- Write contention is theoretically possible under concurrent committee member activity. At ~40 homes, this is not a practical concern.

## Rollback / Exit Strategy

Sequelize's dialect abstraction makes a future migration to PostgreSQL feasible. The primary effort would be testing all migrations against the new dialect and setting up the database server. The workflow engine code itself would require minimal changes, as it interacts with models through Sequelize's ORM, not raw SQL. This migration should be considered if the community grows beyond ~200 homes or if write contention is observed.

## Links

- SRS: SYS-PERF-001, SYS-REL-001, SYS-DATA-001, Section 13 (Risks: file storage on 1GB Linode)
- Related ADRs: ADR-0002 (Polymorphic Workflow), ADR-0005 (Lazy Expiration), ADR-0007 (Separate Attachments)
