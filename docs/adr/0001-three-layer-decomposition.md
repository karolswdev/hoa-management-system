# ADR-0001: Three-Layer Decomposition (Committees / Workflow Engine / ARC Requests)

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** FUNC / MAINT
- **Tier:** MVP
- **Linked Requirements:** SYS-FUNC-001 through SYS-FUNC-033, SYS-MAINT-001, SYS-MAINT-002, SYS-MAINT-003

## Context

The HOA Management System needs to support an Architectural Review Committee (ARC) request workflow where residents submit property modification requests that committee members review, approve, or deny. The SRS explicitly calls out three layered capabilities:

1. **Committees** -- Generic entity for creating named committees with appointed members.
2. **Approval Workflow Engine** -- Reusable, domain-agnostic workflow supporting status transitions, comments, attachments, and notifications.
3. **ARC Requests** -- The first domain-specific request type that plugs into the workflow engine.

The system is a monorepo (Express.js + React) deployed on a 1GB Linode serving approximately 40 homes. The existing codebase follows a service/controller/route/model convention with modules like `boardGovernance.service.js`, `discussion.service.js`, etc.

The SRS identifies future consumers of the workflow engine: maintenance requests, budget approvals, and social event proposals (Section 4). This is not speculative -- these are documented target-tier use cases that justify the decomposition investment at MVP.

## Decision Drivers (Ranked)

1. **Reusability** -- The workflow engine must serve multiple domain types without modification (SYS-MAINT-002).
2. **Separation of concerns** -- Committee management, workflow state machinery, and ARC domain logic are distinct responsibilities.
3. **Existing codebase conventions** -- The project already separates concerns by module (e.g., `board.controller.js` + `boardGovernance.service.js`). The new features should follow the same pattern.
4. **MVP delivery speed** -- The decomposition must not over-engineer. Only ARC requests exist at this tier.
5. **Testability** -- Each layer can be tested in isolation.

## Options Considered

### Option A -- Three-Layer Separation (Chosen)

Committees, Workflow Engine, and ARC Requests as three distinct module groups, each with their own models, services, controllers, and routes.

- **Pros:**
  - Workflow engine is domain-agnostic; adding a new request type requires only a new domain model, routes, and controller (SYS-MAINT-002).
  - Committees are independently useful for non-workflow purposes (display on the website, board governance integration).
  - Each layer has a clear, testable contract. The ICD defines explicit service interfaces for `workflow.service.js` and `committee.service.js`.
  - Follows the existing project convention of one module per domain concern.
- **Cons:**
  - More files and modules than a monolithic approach for what is currently a single use case (ARC).
  - Developers must understand three layers to trace a request end-to-end.
- **Evidence:** The existing codebase already has 12+ service modules. Adding 3 more is consistent with the established granularity.

### Option B -- Two-Layer Separation (ARC Service + Committee Service)

Merge the workflow engine into the ARC request module. Committees remain separate.

- **Pros:**
  - Fewer modules. Simpler for the single-use-case MVP.
- **Cons:**
  - When a second request type is added, the workflow logic must be extracted or duplicated. This violates SYS-MAINT-002.
  - The state machine, transition authorization, comments, and attachments are workflow concerns, not ARC-specific concerns. Coupling them creates a maintenance burden.
- **Evidence:** The SRS explicitly lists 4 future workflow consumers (Section 4). Deferring the separation guarantees a refactor.

### Option C -- Monolithic ARC Module (Status Quo Equivalent)

A single `arc.service.js` that handles committees, workflow states, and ARC-specific logic.

- **Pros:**
  - Fewest files. Fastest initial development.
- **Cons:**
  - Violates SYS-MAINT-001 (workflow must be a standalone module) and SYS-MAINT-002.
  - Committee management has no reusable surface. Other features cannot leverage committees without depending on ARC.
  - The existing codebase does not follow this monolithic pattern; it would be an anomaly.

## Decision

Adopt **Option A: Three-Layer Separation**.

The system will have three distinct module groups following existing project conventions:

- **Committees:** `committee.model.js`, `committeeMembers.model.js`, `committee.service.js`, `committee.controller.js`, `committee.routes.js`
- **Workflow Engine:** `workflowInstance.model.js`, `workflowTransition.model.js`, `workflowComment.model.js`, `workflowAttachment.model.js`, `workflow.service.js`, `workflow.controller.js`, `workflow.routes.js`
- **ARC Requests:** `arcRequest.model.js`, `arcCategory.model.js`, `arcRequest.service.js`, `arcRequest.controller.js`, `arcRequest.routes.js`, `arcCategory.controller.js`, `arcCategory.routes.js`

The workflow engine connects to domain-specific request types via the polymorphic `request_type` + `request_id` pattern (see ADR-0002).

## Consequences

### Positive
- Adding maintenance requests, budget approvals, or event proposals in future tiers requires only new domain modules -- no changes to the workflow engine or committee management.
- Each layer can be tested with focused unit and integration tests.
- Consistent with the project's existing modular architecture.

### Negative
- Developers must trace across three module groups to understand a full ARC request lifecycle.
- Slightly more boilerplate for the MVP, where only one request type exists.

## Rollback / Exit Strategy

If the three-layer separation proves to be unnecessary (i.e., no additional request types are ever added), the layers can be consolidated without data model changes. The database schema is the same regardless of service-layer organization. This decision is reversible at the code level.

## Links

- SRS: Sections 6.1 (Committees), 6.2 (Workflow Engine), 6.3 (ARC Requests)
- ICD: Sections 3.1 (Workflow Service Interface), 3.2 (Committee Service Interface)
- Related ADRs: ADR-0002 (Polymorphic Workflow Engine)
