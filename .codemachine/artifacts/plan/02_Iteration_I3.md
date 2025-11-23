<!-- anchor: iteration-3-plan -->
### Iteration 3: Democracy Module & Hash-Chained Voting

*   **Iteration ID:** `I3`
*   **Goal:** Ship the democracy stack (poll schema, services, UI, hash chain diagrams) enabling informal + binding voting with receipts and optional notifications.
*   **Prerequisites:** `I1` (config + email baseline) and `I2` (accessibility patterns) completed.
*   **Tasks:**

<!-- anchor: task-i3-t1 -->
*   **Task 3.1:**
    *   **Task ID:** `I3.T1`
    *   **Description:** Create SQLite migrations for `Polls`, `PollOptions`, `Votes`, `EmailAudit`, `ResidentNotificationLog`, indexes on `(poll_id, timestamp)` and `(vote_hash)`, plus seeding default poll types/config flags.
    *   **Agent Type Hint:** `DatabaseAgent`
    *   **Inputs:** Data model overview, I1 migration patterns
    *   **Input Files:** [`backend/migrations/20250115_polls.sql`, `backend/seeds/poll_seed.sql`]
    *   **Target Files:** same as inputs + `docs/runbooks/migrations.md`
    *   **Deliverables:** Migration + seed scripts, runbook notes covering apply/rollback/test steps.
    *   **Acceptance Criteria:** Schema matches Section 2.1 tables, indexes present, seeds create sample poll + options, migration timelog recorded.
    *   **Dependencies:** `I1.T1`
    *   **Parallelizable:** No (schema first)

<!-- anchor: task-i3-t2 -->
*   **Task 3.2:**
    *   **Task ID:** `I3.T2`
    *   **Description:** Implement `vote.service.js` (hash chain helper) and `poll.controller.js` endpoints for poll CRUD + voting + receipt verification; ensure transactions use `BEGIN IMMEDIATE`, prev_hash lookup, receipts returned, and logging occurs in `AuditEvent`.
    *   **Agent Type Hint:** `BackendAgent`
    *   **Inputs:** Requirements 2.3, Task 3.1 schema
    *   **Input Files:** [`backend/src/services/vote.service.js`, `backend/src/services/democracy.service.js`, `backend/src/controllers/poll.controller.js`, `backend/src/routes/poll.routes.js`, `backend/tests/poll.controller.test.js`]
    *   **Target Files:** same as inputs + `backend/src/utils/hashChain.js`
    *   **Deliverables:** Service/controller implementations, hash helper, Jest tests covering informal/binding cases + receipt lookup.
    *   **Acceptance Criteria:** Hash formula `SHA256(user_id + option_id + timestamp + prev_hash)` implemented, concurrency safe, tests cover collisions + validation errors, logs include correlation IDs.
    *   **Dependencies:** `I3.T1`
    *   **Parallelizable:** No

<!-- anchor: task-i3-t3 -->
*   **Task 3.3:**
    *   **Task ID:** `I3.T3`
    *   **Description:** Author Democracy Hash Chain sequence diagram (PlantUML) illustrating vote submission, hash computation, receipt verification, email dispatch, and audit logging for both success/failure flows.
    *   **Agent Type Hint:** `DiagrammingAgent`
    *   **Inputs:** Task 3.2 implementation notes, requirements sequence description
    *   **Input Files:** [`docs/diagrams/democracy-sequence.puml`]
    *   **Target Files:** [`docs/diagrams/democracy-sequence.puml`, `docs/diagrams/democracy-sequence.png`]
    *   **Deliverables:** Diagram source + rendered image referenced in docs + release notes.
    *   **Acceptance Criteria:** Diagram compiles, includes Resident/CommunityWebApp/ApiGateway/DemocracyService/VoteIntegrityEngine/EmailNotificationService, highlights transactional boundaries, reviewers approve semantics.
    *   **Dependencies:** `I3.T2`
    *   **Parallelizable:** Yes (after backend stable)

<!-- anchor: task-i3-t4 -->
*   **Task 3.4:**
    *   **Task ID:** `I3.T4`
    *   **Description:** Build frontend `Polls.tsx`, `PollDetail.tsx`, `PollReceiptPage.tsx`, and supporting components (option cards, result bars, receipt chips) leveraging Accessibility tokens + React Query; include React Hook Form for creation modals and integrate helper icons.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Backend endpoints, accessibility patterns
    *   **Input Files:** [`frontend/src/pages/Polls.tsx`, `frontend/src/pages/PollDetail.tsx`, `frontend/src/pages/PollReceipt.tsx`, `frontend/src/components/Polls/PollOptionCard.tsx`, `frontend/src/components/Polls/VoteReceiptChip.tsx`, `frontend/src/api/polls.ts`, `frontend/src/tests/PollDetail.test.tsx`, `frontend/src/tests/PollReceipt.test.tsx`]
    *   **Target Files:** same as inputs + `frontend/src/tests/PollsPage.a11y.test.tsx`
    *   **Deliverables:** Poll list/detail UI, receipt view, tests covering binding flows, accessibility compliance, and helper icon gating.
    *   **Acceptance Criteria:** Poll list filters (type/status) work, vote submissions show receipt + copy functionality, receipts viewable via route, tests cover TTL/resume flows, axe tests pass.
    *   **Dependencies:** `I3.T2`, `I2`
    *   **Parallelizable:** Yes (after API stable)

<!-- anchor: task-i3-t5 -->
*   **Task 3.5:**
    *   **Task ID:** `I3.T5`
    *   **Description:** Update OpenAPI spec for `/polls`, `/polls/{id}/votes`, `/polls/{id}/receipts/{hash}`, `/polls/{id}/options`, `/polls/{id}/notify`, including error schemas, rate limit headers, and feature flag metadata; add JSON examples for binding/informal polls.
    *   **Agent Type Hint:** `DocumentationAgent`
    *   **Inputs:** Task 3.2 + 3.4 outputs
    *   **Input Files:** [`api/openapi.yaml`, `docs/changelog.md`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** Updated spec + changelog entry describing democracy module scope + rollout instructions.
    *   **Acceptance Criteria:** OpenAPI lints cleanly, examples validated, changelog references feature flags (`polls.binding-enabled`, `polls.notify-members-enabled`), documentation cross-links to diagrams.
    *   **Dependencies:** `I3.T2`, `I3.T4`
    *   **Parallelizable:** Yes

<!-- anchor: task-i3-t6 -->
*   **Task 3.6:**
    *   **Task ID:** `I3.T6`
    *   **Description:** Extend `email.service.js` + notification log writer to support poll notification + optional receipt emails, batching recipients, logging to `ResidentNotificationLog`, and capturing correlation IDs for audit.
    *   **Agent Type Hint:** `BackendAgent`
    *   **Inputs:** Task 3.2 service design
    *   **Input Files:** [`backend/src/services/email.service.js`, `backend/src/models/emailAudit.model.js`, `backend/src/models/residentNotificationLog.model.js`, `backend/tests/email.service.test.js`]
    *   **Target Files:** same as inputs + `docs/runbooks/notification-log.md`
    *   **Deliverables:** Updated service + models + tests + runbook describing notify flow + throttling expectations.
    *   **Acceptance Criteria:** Email payload handles BCC batching, retries with backoff, tests simulate success/failure, runbook documents rate limits + audit access.
    *   **Dependencies:** `I3.T2`
    *   **Parallelizable:** Yes (post-controller implementation)

*   **Iteration Exit Criteria:** Democracy schema deployed, backend endpoints + email integrations covered by tests, frontend poll flows accessible + responsive, PlantUML + OpenAPI artifacts merged, feature flags default to disabled pending pilot.
*   **Metrics & Checkpoints:** Monitor hash computation time (<30ms), poll API latency (<300ms p95), optional email success rate (>=99%), React Query cache hits, and number of failing vote attempts in staging (target zero).
*   **Iteration Risks:** SQLite contention during mass voting (mitigate with serialized transactions + backoff), UI confusion around receipts (address with helper copy), and SendGrid rate limits when notifying all members (batch + throttle).
*   **Resource Allocation:** Backend 50%, frontend 30%, documentation/diagramming 10%, QA/security 10% focusing on integrity tests + audit trails.
*   **Hand-off Notes:** Provide CLI script (`scripts/hash-chain-verify.js`) + instructions to ops team, share demo video with board, and annotate config flag defaults for I4 vendor + I5 CI planning.
*   **Tooling Requirements:** Add `npm run test:hashchain` to CI, integrate `sqlite3` integrity check post-migration, ensure PlantUML + Mermaid CLI cached for diagrams, and extend lint rules to cover polling DTO types.
*   **Review Strategy:** Host live walkthrough of poll creation + binding vote to board, run joint QA/back-end test session verifying receipt verification + tamper detection, capture approval notes in release checklist.
*   **Next Iteration Inputs:** Export normalized poll/vote DTO typings + helper utilities to share with vendor notification work, document API client usage patterns for I4 squads, and summarize known UX backlog for future enhancements.
*   **Operational Notes:** Keep democracy feature flags disabled outside staging, define pilot cohort instructions, and prep rollback steps that disable poll routes + hide UI entries via Config toggles if critical bugs appear.
*   **Testing Scope:** Execute load test simulating 50 sequential votes to validate hash chain locking, add Playwright E2E covering vote → receipt verification, and capture screenshots for documentation.
*   **KPIs to Watch:** Poll creation success rate, vote throughput (votes/minute), receipt verification hits, and SendGrid bounce percentage (target <1%).
*   **Documentation Links:** Update `docs/runbooks/democracy.md` with diagram + CLI instructions, reference OpenAPI anchors, and ensure board communication templates stored under `docs/runbooks/release-communications.md#democracy`.
*   **Retrospective Focus:** Capture findings on transaction performance, receipt UX comprehension, and SendGrid throughput to fine-tune vendor notification + CI gating plans in upcoming iterations.
*   **Release Comms:** Draft pilot instructions and FAQ for members (covering receipts + verification) and store templates in `docs/runbooks/release-communications.md` alongside board approval checklist.
