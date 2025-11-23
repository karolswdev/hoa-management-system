<!-- anchor: iteration-4-plan -->
### Iteration 4: Vendor Directory & Communications Enhancements

*   **Iteration ID:** `I4`
*   **Goal:** Deliver vendor schema + moderation flow, resident-facing vendor directory, admin management tooling, and supporting docs while refining notification infrastructure for future outreach.
*   **Prerequisites:** `I1` (config/email foundation) and `I3` (notification log + OpenAPI patterns) done.
*   **Tasks:**

<!-- anchor: task-i4-t1 -->
*   **Task 4.1:**
    *   **Task ID:** `I4.T1`
    *   **Description:** Create SQLite migration for `Vendors` (name, category, contact_info, rating, notes, visibility_scope, moderation_state, created_by, timestamps) plus indexes `(visibility_scope, service_category)`; seed baseline categories; generate Vendor Moderation Flowchart (Mermaid) mapping submission→approval pipeline.
    *   **Agent Type Hint:** `DatabaseAgent`
    *   **Inputs:** Requirements 2.4, architecture docs
    *   **Input Files:** [`backend/migrations/20250201_vendors.sql`, `backend/seeds/vendor_seed.sql`, `docs/diagrams/vendor-flowchart.mmd`]
    *   **Target Files:** same as inputs + `docs/diagrams/vendor-flowchart.svg`
    *   **Deliverables:** Migration + seed + Mermaid flowchart.
    *   **Acceptance Criteria:** Schema matches spec, indexes created, seeds populate canonical categories, Mermaid compiles + shows states (pending/approved/denied) with admin touches.
    *   **Dependencies:** `I1.T1`
    *   **Parallelizable:** No (foundation)

<!-- anchor: task-i4-t2 -->
*   **Task 4.2:**
    *   **Task ID:** `I4.T2`
    *   **Description:** Implement backend vendor model, controller (`vendor.controller.js`), routes, and service enforcing moderation + visibility config (`vendors.public-categories`), caching, search filters, role-based CRUD; update OpenAPI for vendor endpoints.
    *   **Agent Type Hint:** `BackendAgent`
    *   **Inputs:** Task 4.1 schema, config registry
    *   **Input Files:** [`backend/src/models/vendor.model.js`, `backend/src/services/vendorDirectory.service.js`, `backend/src/controllers/vendor.controller.js`, `backend/src/routes/vendor.routes.js`, `backend/tests/vendor.controller.test.js`, `api/openapi.yaml`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** Vendor backend stack + tests + spec updates integrated with config flags + audit logging.
    *   **Acceptance Criteria:** CRUD endpoints enforce auth + moderation states, caching TTL logged, tests cover guest/member/admin scopes, OpenAPI validated.
    *   **Dependencies:** `I4.T1`
    *   **Parallelizable:** No

<!-- anchor: task-i4-t3 -->
*   **Task 4.3:**
    *   **Task ID:** `I4.T3`
    *   **Description:** Build resident-facing `Vendors.tsx` page with grid/list toggle, filters (category, rating), detail drawer, and vendor submission form gated by role; integrate Accessibility tokens + helper icons; add React Query hooks + caching.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Backend APIs, accessibility patterns
    *   **Input Files:** [`frontend/src/pages/Vendors.tsx`, `frontend/src/components/Vendors/VendorCard.tsx`, `frontend/src/components/Vendors/VendorFilters.tsx`, `frontend/src/components/Vendors/VendorForm.tsx`, `frontend/src/api/vendors.ts`, `frontend/src/tests/VendorsPage.test.tsx`]
    *   **Target Files:** same as inputs + `frontend/src/tests/VendorsPage.a11y.test.tsx`
    *   **Deliverables:** Vendor listing UI + submission form + tests.
    *   **Acceptance Criteria:** Filters + search responsive, accessibility toggle adjusts layout, tests cover guest vs member scope, React Query caches invalidated on submission.
    *   **Dependencies:** `I4.T2`, `I2`
    *   **Parallelizable:** Yes (after API stable)

<!-- anchor: task-i4-t4 -->
*   **Task 4.4:**
    *   **Task ID:** `I4.T4`
    *   **Description:** Create admin Vendor Management page (pending/approved tabs, bulk status updates, audit log view), integrate FeatureFlagAdmin UI improvements for vendor-related flags, and expose vendor moderation stats via `/metrics`.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Backend vendor service + metrics requirement
    *   **Input Files:** [`frontend/src/pages/admin/VendorManagement.tsx`, `frontend/src/components/Vendors/VendorTable.tsx`, `frontend/src/api/vendors.ts`, `backend/src/controllers/vendor.controller.js`, `backend/src/routes/vendor.routes.js`, `backend/src/metrics/vendorMetrics.js`]
    *   **Target Files:** same as inputs + `docs/runbooks/vendor-moderation.md`
    *   **Deliverables:** Admin UI + metrics wiring + runbook covering moderation process + config flags.
    *   **Acceptance Criteria:** Admin UI supports approve/deny/visibility toggles with confirmation modals, metrics counter increments, runbook describes steps + escalation path, tests verify role gating.
    *   **Dependencies:** `I4.T2`
    *   **Parallelizable:** Yes

<!-- anchor: task-i4-t5 -->
*   **Task 4.5:**
    *   **Task ID:** `I4.T5`
    *   **Description:** Extend EmailNotificationService + ResidentNotificationLog to capture vendor submission notifications (admin alerts) and optional resident broadcast when new vendor approved; ensure templates align with board tone + include unsubscribe instructions.
    *   **Agent Type Hint:** `BackendAgent`
    *   **Inputs:** Existing email service, vendor requirements
    *   **Input Files:** [`backend/src/services/email.service.js`, `backend/src/models/residentNotificationLog.model.js`, `backend/tests/email.service.test.js`, `docs/runbooks/notification-log.md`]
    *   **Target Files:** same as inputs + `docs/runbooks/notification-log.md`
    *   **Deliverables:** Email service enhancements + tests + runbook updates summarizing vendor notification path.
    *   **Acceptance Criteria:** Emails include proper subjects + recipients, logs store summary, tests cover success/failure, documentation updated.
    *   **Dependencies:** `I3.T6`
    *   **Parallelizable:** Yes

<!-- anchor: task-i4-t6 -->
*   **Task 4.6:**
    *   **Task ID:** `I4.T6`
    *   **Description:** Execute integrated QA: vendor flows, poll notifications, accessibility toggles, ensuring CI builds pass; craft release checklist + pilot instructions referencing vendor + democracy modules.
    *   **Agent Type Hint:** `QAAgent`
    *   **Inputs:** All prior tasks + docs
    *   **Input Files:** [`docs/runbooks/release-checklist.md`, `docs/testing/vendor-suite-report.md`, `docs/changelog.md`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** QA report, updated checklist, changelog entries summarizing vendor directory + notification improvements.
    *   **Acceptance Criteria:** QA report documents test matrix results, release checklist includes vendor-specific verifications, changelog ready for board review.
    *   **Dependencies:** `I4.T2`, `I4.T3`, `I4.T4`, `I4.T5`
    *   **Parallelizable:** No (culminating QA)

*   **Iteration Exit Criteria:** Vendor schema + flowchart approved, backend + frontend features functional + tested, notification updates documented, admin runbooks ready, release checklist updated, feature flags default to guest-limited exposure until board approval.
*   **Metrics & Checkpoints:** Monitor vendor query latency (<200ms), moderation queue length, email success rate, React Query cache hits, accessibility audit results for vendor UI, and doc completion status.
*   **Iteration Risks:** Scope creep from vendor rating moderation, potential confusion over guest vs member visibility (mitigate via config + UI labeling), admin workload for approvals (document SLA + automation ideas).
*   **Resource Allocation:** Backend 35%, frontend 35%, documentation 15%, QA 15%; maintain daily cross-functional sync to align vendor + notification changes.
*   **Hand-off Notes:** Provide vendor DTO typings + API docs to I5 team, share metrics instrumentation instructions, and note any outstanding backlog items (e.g., vendor reviews roadmap) for future planning.
*   **Tooling Requirements:** Add vendor Storybook stories, extend Playwright tests for vendor flows, ensure Mermaid CLI script tracked for vendor flowchart regen, update ESLint config for vendor directories.
*   **Review Strategy:** Conduct admin UX walkthrough with vendor liaison, gather board communications approval for vendor announcement, and require QA sign-off before toggling flags.
*   **Next Iteration Inputs:** Summaries of CI/CD changes required to monitor vendor endpoints, doc links for new notifications, and prioritized technical debt for automation to feed into I5 pipeline work.
*   **Operational Notes:** Keep vendor visibility flag defaulted to members-only for pilot, document toggle instructions + rollback steps, and align resident newsletter copy with board communications team.
*   **Testing Scope:** Include manual moderation workflow tests, cross-browser vendor layout checks, and SendGrid email previews verifying unsubscribe text.
*   **KPIs to Watch:** Vendor submissions/week, approval turnaround time, email open rate for vendor announcements, and support tickets referencing vendor data accuracy.
*   **Documentation Links:** Ensure `docs/runbooks/vendor-moderation.md` references flowchart + runbook steps, add `README.md` section summarizing vendor directory for new contributors.
*   **Retrospective Focus:** Evaluate moderation SLA, caching performance, and communication load to adjust automation backlog + future enhancements.
*   **Release Comms:** Draft vendor directory announcement + FAQ in `docs/runbooks/release-communications.md#vendors`, review with board communications officer, and store email template for SendGrid campaigns.
*   **Collaboration Hooks:** Sync weekly with communications + compliance volunteers to confirm vendor policy messaging, coordinate with QA on cross-browser coverage, and loop in CI maintainers on metrics additions feeding into I5 work.
