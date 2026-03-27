# ADR-0002: Polymorphic Workflow Engine via request_type + request_id

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** DATA / MAINT
- **Tier:** MVP
- **Linked Requirements:** SYS-FUNC-023, SYS-MAINT-001, SYS-MAINT-002

## Context

The workflow engine must associate each workflow instance with a domain-specific request (e.g., an ARC request) while remaining domain-agnostic (SYS-FUNC-023). The engine handles status transitions, comments, and attachments without knowing the specifics of what is being approved. A mechanism is needed to link `workflow_instances` rows to their corresponding domain rows (e.g., `arc_requests`).

The system uses Sequelize ORM with SQLite3, which lacks native polymorphic association support. Sequelize does provide a `scopes` pattern for polymorphic associations, but it is convention-based rather than database-enforced.

## Decision Drivers (Ranked)

1. **Domain agnosticism** -- The workflow engine must not import or reference domain-specific models (SYS-MAINT-001).
2. **Extensibility** -- Adding a new request type must not require schema changes to workflow tables (SYS-MAINT-002).
3. **Query simplicity** -- Lookups from workflow to domain and domain to workflow must be efficient.
4. **Referential integrity** -- Data consistency between workflow instances and domain rows.
5. **SQLite compatibility** -- No features that require PostgreSQL or MySQL-specific capabilities.

## Options Considered

### Option A -- Polymorphic Discriminator (request_type + request_id) (Chosen)

The `workflow_instances` table has two columns: `request_type` (string discriminator, e.g., `'arc_request'`) and `request_id` (integer FK to the domain table). A composite index on `(request_type, request_id)` supports efficient lookups.

- **Pros:**
  - Single `workflow_instances` table serves all domain types. No schema changes when adding new types.
  - Well-understood pattern in ORMs (Rails, Django, Laravel all use this approach).
  - Sequelize supports this via scoped associations.
  - Clean separation: the workflow service resolves domain data only when explicitly asked (e.g., detail views), not during state transitions.
  - Composite index makes lookups performant.
- **Cons:**
  - No database-level foreign key constraint on `request_id` (SQLite cannot have conditional FKs). Referential integrity is enforced at the application layer.
  - Queries joining workflow to domain require dynamic table resolution, which cannot be done in a single SQL JOIN without knowing the type. In practice, the application resolves this in two queries (fetch workflow, then fetch domain record by type).
- **Evidence:** This is the standard pattern in Django (GenericForeignKey), Rails (polymorphic associations), and Laravel (morphTo). At the scale of ~40 homes with low request volume, the two-query approach has negligible performance impact.

### Option B -- Separate Workflow Tables Per Domain Type

Each domain type gets its own workflow table: `arc_workflow_instances`, `maintenance_workflow_instances`, etc. All share the same column structure.

- **Pros:**
  - Database-level foreign key constraints are possible (e.g., `arc_workflow_instances.request_id` FK to `arc_requests.id`).
  - No discriminator column needed.
- **Cons:**
  - Violates SYS-MAINT-001 and SYS-MAINT-002: adding a new request type requires creating new workflow tables, new migrations, and new models.
  - Cross-type queries (e.g., "show all pending workflows for this committee") require UNION across tables.
  - Duplicates the state machine, transition, comment, and attachment tables per type.
  - At ~40 homes, the referential integrity benefit is marginal compared to the maintenance cost.

### Option C -- Single-Table Inheritance (All Domain Fields on workflow_instances)

Add all domain-specific fields (property_address, category_id, etc.) directly to the `workflow_instances` table, using nullable columns for fields that only apply to certain types.

- **Pros:**
  - Single table, single JOIN. Simplest queries.
  - Database-level constraints possible on shared columns.
- **Cons:**
  - Violates domain agnosticism entirely. The workflow table becomes aware of every domain type.
  - Nullable columns proliferate as domain types are added. Schema becomes unwieldy.
  - Every new domain type requires a migration to add its columns to the workflow table.
  - Breaks SYS-MAINT-001 and SYS-MAINT-002.

## Decision

Adopt **Option A: Polymorphic Discriminator** (`request_type` + `request_id`).

The `workflow_instances` table stores `request_type` as a string (e.g., `'arc_request'`) and `request_id` as an integer. A composite index on `(request_type, request_id)` supports efficient lookups. Referential integrity is enforced at the application layer: the ARC request service creates the workflow instance within a transaction, and deletion (if ever needed) cascades through the service layer.

The workflow service exposes a `getWorkflowDetail(workflowId)` function that returns workflow data without domain-specific data. Domain-specific detail views (e.g., `GET /api/arc-requests/:id`) are responsible for fetching both the domain record and its associated workflow, composing the response in the ARC controller.

## Consequences

### Positive
- The workflow engine has zero knowledge of domain-specific models. New request types register by convention (string discriminator), not by schema change.
- All workflow queries (by committee, by status, by submitter) operate on a single table with standard indexes.
- The ICD's `workflow.service.js` interface (Section 3.1) works without modification for any future request type.

### Negative
- No database-level FK from `request_id` to the domain table. If a domain row is deleted without cleaning up the workflow instance, orphaned records can result. Mitigation: domain services must delete within transactions, and a periodic integrity check (backlog item for mvp-mid) can detect orphans.
- Detail views that combine workflow + domain data require two queries. At this scale, this is not a performance concern.

## Rollback / Exit Strategy

The polymorphic pattern can be replaced with dedicated tables (Option B) if the number of domain types grows large enough to warrant it, or if referential integrity issues become problematic. The migration path would involve creating type-specific tables and migrating existing `workflow_instances` rows by `request_type`. This is straightforward but non-trivial.

## Links

- SRS: SYS-FUNC-023, Section 8.1 (workflow_instances schema), Section 8.2 (relationships)
- ICD: Section 3.1 (Workflow Service Interface)
- Related ADRs: ADR-0001 (Three-Layer Decomposition)
