<!-- anchor: directives-process -->
## 4. DIRECTIVES & STRICT PROCESS

*   Follow the Standard Kit mandates: stay within the layered monolith, ship SQLite migrations + seeds per feature, gate releases via Config flags, and document every schema/API change before merging.
*   Practice atomic task execution: each autonomous agent works from up-to-date `main`, runs targeted tests, and attaches evidence (lint/test output, diagram previews) to task notes to keep work auditable.
*   Honor resource + security constraints: enforce rate limits + CAPTCHA on contact endpoints, keep Node memory under 512MB, never store secrets outside env vars, and redact resident data in logs.
*   Testing expectations: backend tasks require Jest specs or integration scripts, frontend tasks require RTL and axe smoke tests, and diagram/spec deliverables include linting/validation passes.
*   Documentation discipline: update OpenAPI, runbooks, and changelogs inline with implementation so later iterations inherit accurate references.

<!-- anchor: iteration-plan-overview -->
## 5. Iteration Plan

*   **Total Iterations Planned:** 5
*   **Iteration Dependencies:** I2 depends on I1 Board APIs and theme skeleton; I3 depends on I1 data scaffolding + I2 accessibility patterns; I4 depends on I1 config + email services and I3 notification hooks; I5 depends on all earlier feature work to finalize CI/CD, verification, and rollout runbooks.

<!-- anchor: iteration-1-plan -->
### Iteration 1: Board Governance Foundations & Shared Models

*   **Iteration ID:** `I1`
*   **Goal:** Establish board governance schemas, controllers, and initial architectural artifacts that define module boundaries for downstream work.
*   **Prerequisites:** None
*   **Tasks:**

<!-- anchor: task-i1-t1 -->
*   **Task 1.1:**
    *   **Task ID:** `I1.T1`
    *   **Description:** Author SQLite migrations + seeds for `BoardTitles`, `BoardMembers`, `ConfigFlag` entries (`board.visibility`, `board.history-visibility`), and baseline `ThemePreset` plus Accessibility defaults, ensuring rollback scripts exist.
    *   **Agent Type Hint:** `DatabaseAgent`
    *   **Inputs:** Requirements Section 2.1, Data Model overview
    *   **Input Files:** [`backend/migrations/`, `docs/02_System_Structure_and_Data.md`]
    *   **Target Files:** [`backend/migrations/20250101_board.sql`, `backend/seeds/board_seed.sql`, `docs/runbooks/migrations.md`]
    *   **Deliverables:** SQL migration + seed files, migration runbook entry summarizing application order and verification steps.
    *   **Acceptance Criteria:** Migrations run cleanly on fresh DB, tables/columns/indexes match ERD, seeds insert ordered titles + config defaults, rollback scripts restore pre-change state.
    *   **Dependencies:** None
    *   **Parallelizable:** No (serializes schema baseline)

<!-- anchor: task-i1-t2 -->
*   **Task 1.2:**
    *   **Task ID:** `I1.T2`
    *   **Description:** Produce Component Diagram (PlantUML) highlighting CommunityWebApp, AdminConsole, ApiGateway, BoardGovernanceService, DemocracyService, VendorDirectoryService, ConfigRegistry, EmailNotificationService interactions to inform module contracts.
    *   **Agent Type Hint:** `DiagrammingAgent`
    *   **Inputs:** Architecture overview, requirements
    *   **Input Files:** [`docs/02_System_Structure_and_Data.md`]
    *   **Target Files:** [`docs/diagrams/component-board-democracy.puml`, `docs/diagrams/component-board-democracy.png`]
    *   **Deliverables:** Valid PlantUML source + rendered preview committed for reviewer reference.
    *   **Acceptance Criteria:** Diagram renders without syntax errors, reflects up-to-date modules + comms paths, legend explains color/notation, reviewers sign off via checklist.
    *   **Dependencies:** `I1.T1` (ensures entity list stable)
    *   **Parallelizable:** Yes (after `I1.T1` wraps)

<!-- anchor: task-i1-t3 -->
*   **Task 1.3:**
    *   **Task ID:** `I1.T3`
    *   **Description:** Generate Mermaid ERD documenting BoardTitles/Members, ContactRequest, ConfigFlag, ThemePreset, AccessibilityPreference relationships and store as canonical schema reference.
    *   **Agent Type Hint:** `DiagrammingAgent`
    *   **Inputs:** Migration outputs, requirements data model
    *   **Input Files:** [`backend/migrations/`, `docs/02_System_Structure_and_Data.md`]
    *   **Target Files:** [`docs/diagrams/board-data-erd.mmd`, `docs/diagrams/board-data-erd.svg`]
    *   **Deliverables:** Mermaid ERD source + exported SVG, plus short README snippet referencing usage.
    *   **Acceptance Criteria:** ERD compiles, entities + PK/FK names match migrations, README explains update cadence, reviewers approve traceability.
    *   **Dependencies:** `I1.T1`
    *   **Parallelizable:** Yes (with `I1.T2` once migrations finalized)

<!-- anchor: task-i1-t4 -->
*   **Task 1.4:**
    *   **Task ID:** `I1.T4`
    *   **Description:** Implement backend board endpoints (`GET /board`, `GET /board/history`, `POST /board/contact`, admin CRUD) with visibility enforcement, captcha validation, SendGrid email integration, and rate limiting.
    *   **Agent Type Hint:** `BackendAgent`
    *   **Inputs:** Requirements 2.1, migrations, diagrams
    *   **Input Files:** [`backend/src/controllers/board.controller.js`, `backend/src/services/boardGovernance.service.js`, `backend/src/services/email.service.js`, `backend/src/routes/board.routes.js`]
    *   **Target Files:** [`backend/src/controllers/board.controller.js`, `backend/src/services/boardGovernance.service.js`, `backend/src/services/email.service.js`, `backend/src/routes/board.routes.js`, `backend/tests/board.controller.test.js`]
    *   **Deliverables:** Updated controllers/services/routes/tests covering roster/history/contact flows.
    *   **Acceptance Criteria:** All endpoints enforce visibility + auth rules, SendGrid payload sanitized, Jest tests cover success/error paths, lint/test suites pass.
    *   **Dependencies:** `I1.T1`, `I1.T2`, `I1.T3`
    *   **Parallelizable:** No (core API path)

<!-- anchor: task-i1-t5 -->
*   **Task 1.5:**
    *   **Task ID:** `I1.T5`
    *   **Description:** Update OpenAPI spec documenting board endpoints, request/response schemas, captcha requirements, rate limit headers, and feature flag metadata; publish short changelog entry.
    *   **Agent Type Hint:** `DocumentationAgent`
    *   **Inputs:** Implementation from `I1.T4`
    *   **Input Files:** [`api/openapi.yaml`, `docs/changelog.md`]
    *   **Target Files:** [`api/openapi.yaml`, `docs/changelog.md`]
    *   **Deliverables:** Validated OpenAPI diff + release note referencing new board module features.
    *   **Acceptance Criteria:** OpenAPI lints cleanly, new schemas match controller DTOs, changelog references feature flags + rollout notes, reviewers confirm accuracy.
    *   **Dependencies:** `I1.T4`
    *   **Parallelizable:** Yes (can run after `I1.T4` while others prep frontend work)

*   **Iteration Exit Criteria:** Migrations applied in dev/staging, ERD + component diagram approved, OpenAPI merged, board endpoints deployed behind `board.visibility` flag, regression suite + lint pass documented in CI artifacts.
*   **Metrics & Checkpoints:** Track migration runtime (<1 min), board endpoint latency baseline (<250ms p95), contact email success rate = 100% in staging, documentation checklist completed and linked in task notes.
*   **Iteration Risks:** SQLite locking during board history queries (mitigated via indexes + LIMIT usage), SendGrid sandbox throttling (coordinate API key access before contact tests), and diagram drift (freeze plan reviewers before coding starts).
*   **Resource Allocation:** Database + backend agents own 60% of iteration capacity, documentation/diagramming agents 25%, with a 15% buffer earmarked for emergent test hardening or config flag adjustments discovered mid-iteration.
*   **Hand-off Notes:** Provide runbook links, ERD/diagram preview URLs, and OpenAPI diff summary to I2 team so Accessibility + frontend squads can rely on stable APIs without rereading migration SQL.
*   **Tooling Requirements:** Ensure `npm run lint`, `npm run test:backend`, and `npm run migrate:check` run inside CI for every merge request; diagram tasks rely on PlantUML CLI + Mermaid CLI containers pinned in `package.json` scripts for deterministic renders.
*   **Review Strategy:** Daily async checkpoint summarizing migration status, diagram approvals, and API test coverage shared in project channel; blockers escalated within 4 business hours per governance charter.
*   **Artifacts Storage:** Commit rendered PNG/SVG outputs alongside source `.puml`/`.mmd` files and reference them in `docs/README.md` to streamline downstream agent discovery.
*   **Collaboration Hooks:** Reference issue IDs + owners in every PR, tag board liaison for reviews touching resident communications, and capture approvals in `docs/runbooks/release-checklist.md` for audit readiness.
*   **Next Iteration Inputs:** Deliver API client stubs, config flag documentation, and board contact UX notes to I2 backlog groomers so accessibility enhancements can reuse the new DTOs immediately.
*   **Documentation Links:** Ensure `docs/runbooks/migrations.md` and `docs/README.md#board-module` sections reference migration IDs, diagrams, and API spec anchors produced here for quick lookup.
*   **Retrospective Focus:** Capture lessons on migration tooling + hash-helper prototyping so I3 democracy work inherits proven transaction patterns and avoids repeating schema pitfalls.
