<!-- anchor: iteration-5-plan -->
### Iteration 5: CI/CD Hardening, Verification & Launch Prep

*   **Iteration ID:** `I5`
*   **Goal:** Finalize automation, verification, and operational readiness—enhancing CI/CD workflows, health monitoring, release documentation, and cross-module QA to prepare staged rollouts.
*   **Prerequisites:** `I1`–`I4` functional increments merged and feature flags documented.
*   **Tasks:**

<!-- anchor: task-i5-t1 -->
*   **Task 5.1:**
    *   **Task ID:** `I5.T1`
    *   **Description:** Update `.github/workflows/ci.yml` to add `npm audit --audit-level=critical`, enforce backend/frontend lint/test steps, integrate accessibility + hashchain test jobs, and publish artifacts (coverage, lint logs) for review.
    *   **Agent Type Hint:** `DevOpsAgent`
    *   **Inputs:** Requirements Section 3, prior workflow files
    *   **Input Files:** [`.github/workflows/ci.yml`, `package.json`, `README.md`]
    *   **Target Files:** same as inputs + `docs/runbooks/ci-pipeline.md`
    *   **Deliverables:** Updated workflow, docs explaining new jobs + failure handling.
    *   **Acceptance Criteria:** CI runs lint/test/audit in parallel where possible, fails on critical vulnerabilities, docs outline troubleshooting steps, sample run screenshot/summary attached.
    *   **Dependencies:** `I1`–`I4` code ready
    *   **Parallelizable:** No (pipeline base)

<!-- anchor: task-i5-t2 -->
*   **Task 5.2:**
    *   **Task ID:** `I5.T2`
    *   **Description:** Enhance `.github/workflows/deploy.yml` to run docker build, start container, execute migrations in temp volume, `curl /healthz` + `/metrics`, and only then push to GHCR; accompany with CI/CD workflow diagram (Mermaid) documenting gate sequence.
    *   **Agent Type Hint:** `DevOpsAgent`
    *   **Inputs:** Current deploy workflow, operations doc
    *   **Input Files:** [`.github/workflows/deploy.yml`, `docs/diagrams/cicd-pipeline.mmd`, `docs/diagrams/cicd-pipeline.svg`, `docs/runbooks/deployment.md`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** Updated deploy workflow + Mermaid diagram + runbook adjustments.
    *   **Acceptance Criteria:** Workflow includes docker health gate + `curl` steps, diagram renders, runbook describes gating + rollback, dry run logs attached.
    *   **Dependencies:** `I5.T1`
    *   **Parallelizable:** No

<!-- anchor: task-i5-t3 -->
*   **Task 5.3:**
    *   **Task ID:** `I5.T3`
    *   **Description:** Implement/refresh health tooling: `scripts/healthcheck.sh`, optional Python CLI for hash chain verification, cron instructions for HealthMonitor, and `/healthz` response enhancements (theme checksum, config cache age); update runbooks.
    *   **Agent Type Hint:** `BackendAgent`
    *   **Inputs:** Health requirements, democracy outputs
    *   **Input Files:** [`scripts/healthcheck.sh`, `scripts/hash-chain-verify.js`, `backend/src/controllers/health.controller.js`, `docs/runbooks/health-monitor.md`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** Scripts, controller updates, runbook instructions for cron + alerting.
    *   **Acceptance Criteria:** Scripts runnable locally + in CI, `/healthz` returns extended JSON, runbook lists cron schedule + contact tree, tests verifying health endpoint responses.
    *   **Dependencies:** `I5.T2`
    *   **Parallelizable:** Yes (after deploy workflow baseline)

<!-- anchor: task-i5-t4 -->
*   **Task 5.4:**
    *   **Task ID:** `I5.T4`
    *   **Description:** Execute integrated verification: Playwright E2E (board, accessibility toggle, polls, vendors), Jest coverage review, sqlite integrity check, SendGrid sandbox tests; compile Verification Report aligning with Section 6 strategy.
    *   **Agent Type Hint:** `QAAgent`
    *   **Inputs:** Completed features
    *   **Input Files:** [`tests/e2e/playwright.config.ts`, `tests/e2e/*.spec.ts`, `docs/testing/verification-report.md`, `docs/changelog.md`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** Updated tests, verification report summarizing pass/fail, changelog release entry referencing verification status.
    *   **Acceptance Criteria:** All tests pass, coverage >= targeted thresholds, verification report signed by QA + board sponsor, changelog ready for release.
    *   **Dependencies:** `I5.T1`–`I5.T3`
    *   **Parallelizable:** No

<!-- anchor: task-i5-t5 -->
*   **Task 5.5:**
    *   **Task ID:** `I5.T5`
    *   **Description:** Finalize documentation + knowledge transfer: update `README`, `docs/runbooks/` (deploy, backups, feature flags), `docs/design/accessibility-suite.md`, training slides, and produce knowledge-transfer checklist referencing anchors + manifest.
    *   **Agent Type Hint:** `DocumentationAgent`
    *   **Inputs:** All prior deliverables
    *   **Input Files:** [`README.md`, `docs/runbooks/deployment.md`, `docs/runbooks/feature-flags.md`, `docs/design/accessibility-suite.md`, `docs/runbooks/release-communications.md`, `docs/knowledge-transfer-checklist.md`]
    *   **Target Files:** same as inputs + `docs/knowledge-transfer-checklist.md`
    *   **Deliverables:** Updated docs, KT checklist, release notes referencing plan anchors.
    *   **Acceptance Criteria:** Docs reference final artifacts/anchors, KT checklist covers system overview + operations, release communications template finalized, approvals recorded.
    *   **Dependencies:** `I5.T4`
    *   **Parallelizable:** No

<!-- anchor: task-i5-t6 -->
*   **Task 5.6:**
    *   **Task ID:** `I5.T6`
    *   **Description:** Pilot planning + metrics instrumentation: configure feature flag rollout scripts, set KPI dashboards (board engagement, accessibility adoption, poll participation, vendor metrics), and prepare Go/No-Go checklist referencing plan manifest.
    *   **Agent Type Hint:** `OperationsAgent`
    *   **Inputs:** KPIs from previous iterations, docs
    *   **Input Files:** [`docs/runbooks/feature-flags.md`, `docs/metrics/kpi-dashboard.md`, `docs/runbooks/go-no-go-checklist.md`, `plan_manifest.json`]
    *   **Target Files:** same as inputs
    *   **Deliverables:** Updated flag runbook, KPI dashboard doc or spreadsheet instructions, Go/No-Go checklist with anchor references.
    *   **Acceptance Criteria:** Rollout steps enumerated per module, KPI queries documented, Go/No-Go includes verification + communication sign-offs tied to plan anchors.
    *   **Dependencies:** `I5.T5`
    *   **Parallelizable:** No

*   **Iteration Exit Criteria:** CI/CD workflows running with new gates, health scripts validated, verification report + documentation complete, KPI dashboards + rollout checklist approved by board, all plan artifacts linked in manifest.
*   **Metrics & Checkpoints:** Monitor CI duration, audit failure counts, docker deploy success rate, healthcheck uptime, E2E pass rate, doc coverage vs checklist items, KPI dashboard completeness.
*   **Iteration Risks:** CI runtime increases (mitigate with caching + matrix optimization), health script false positives (add retries + manual overrides), documentation fatigue (enforce peer review rotations).
*   **Resource Allocation:** DevOps 40%, QA 25%, documentation 25%, operations 10%; keep weekly readiness review with board sponsor.
*   **Hand-off Notes:** Provide manifest + anchor references to autonomous agents, ensure board receives condensed runbook + training deck, archive verification evidence for compliance.
*   **Tooling Requirements:** Add `make verify` aggregator command, integrate `shellcheck` for scripts, ensure Mermaid CLI installed for CI diagrams, configure GitHub status checks for new workflows.
*   **Review Strategy:** Conduct readiness review (board + ops), run table-top incident drill verifying rollback + comms, finalize release timeline with sign-offs recorded in `docs/runbooks/go-no-go-checklist.md`.
*   **Next Iteration Inputs:** Not applicable (project closure), but leave backlog of optional enhancements (resident metrics dashboard, automation) with references to plan anchors for future agents.
*   **Operational Notes:** Schedule backup + snapshot pre-launch, confirm SendGrid keys rotated, verify `/healthz` accessible externally, ensure HealthMonitor cron instructions tested on staging Linode.
*   **Testing Scope:** Include failure-injection tests (forced SendGrid failure, config flag mis-set) to validate monitoring + rollback; document findings in verification report appendices.
*   **KPIs to Watch:** CI pass rate, audit failure count, deployment MTTR, accessibility toggle adoption post-launch, vendor approval SLA, poll receipt verification hits.
*   **Documentation Links:** Update plan manifest + README to highlight anchor keys for directives, architecture, iteration tasks, and verification strategy for quick navigation.
*   **Retrospective Focus:** Summarize overall roadmap outcomes, measure adherence to Simplicity/Stability/Security, and capture improvements for future HOA initiatives.
*   **Collaboration Hooks:** Align weekly with board officers + volunteer operators to review KPI dashboards, confirm training attendance, and assign on-call rotation for post-launch monitoring.
