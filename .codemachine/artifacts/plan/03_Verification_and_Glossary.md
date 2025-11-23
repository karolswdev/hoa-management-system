<!-- anchor: verification-and-integration-strategy -->
## 6. Verification and Integration Strategy

*   **Testing Levels:**
    *   **Unit:** Jest + RTL cover board controllers/services, vote hash helper, vendor filters, accessibility context/theme; aim for >80% coverage in touched modules with fixtures representing config flag variants.
    *   **Integration:** Playwright, supertest, and sqlite-backed service tests exercise REST flows (board contact, polls, vendor CRUD) using in-memory or temp DB, ensuring rate limits + feature flags behave inside realistic transactions.
    *   **E2E:** Browser-driven scripts validate golden user journeys (board roster visibility toggle, poll vote→receipt verification, vendor submission approval, accessibility toggle persistence) on staging containers mirroring Linode env.
    *   **Non-Functional:** Accessibility sweeps (axe + manual screen reader), performance budgets (LCP <2.5s high-vis), security checks (npm audit critical gating, captcha verification), and resiliency tests (SendGrid failure simulation) executed per iteration exit criteria.
*   **Test Data & Environments:**
    *   Dedicated SQLite fixtures for unit tests, seeded via migration scripts; staging Linode clones production env but points to SendGrid sandbox keys and uses sample resident data.
    *   Feature flags default to safe/off states; test harness toggles them per scenario using config controller helpers + CLI scripts.
    *   Anonymous vote mode validated with synthetic poll data; binding polls validated with deterministic user IDs for reproducible hash receipts.
*   **CI/CD Expectations:**
    *   `ci.yml` pipeline order: checkout → install deps → lint/test (backend + frontend + accessibility) → npm audit → build artifacts; all tasks required to pass for merge.
    *   `deploy.yml` pipeline: docker build → run migrations on temp volume → start container → curl `/healthz` + `/metrics` → push to GHCR → manual approval → remote deploy script; failure at any gate blocks release.
    *   GitHub required checks: `lint`, `test`, `accessibility`, `audit`, `hashchain`, `playwright`, `ci-docs` (ensures changelog + runbooks updated when relevant files change).
*   **Quality Gates:**
    *   Coverage threshold 80% backend, 75% frontend; gating job fails if below or diff coverage decreases by >5% for touched files.
    *   npm audit must report zero critical vulnerabilities; Dependabot alerts triaged within 48h.
    *   Accessibility gate fails on any axe violation; re-run required after fixes.
    *   Database migrations require plan/apply/rollback test executed in CI before merging.
*   **Artifact Validation:**
    *   PlantUML + Mermaid diagrams linted via CLI; rendered PNG/SVG artifacts stored in `docs/diagrams/` and validated by pre-commit script checking timestamp + size diff.
    *   OpenAPI spec validated using `swagger-cli validate`; diffs linked in PR description with anchor references (e.g., `api/openapi.yaml#L200`).
    *   Runbooks + docs linted using markdownlint; review checklist ensures instructions include env, commands, verification steps.
    *   plan_manifest.json validated via JSON schema to guarantee anchor paths align with generated Markdown files.
*   **Integration Strategy:**
    *   Feature flags orchestrate staged rollout: enable modules for admins → pilot group → general availability; each phase requires verifying `/healthz`, KPIs, and support readiness.
    *   SendGrid integration tested in sandbox mode first, then limited pilot addresses; ResidentNotificationLog entries audited after each campaign.
    *   ConfigRegistry TTL caches cleared via admin endpoint post-deploy; clients rely on `expiresAt` metadata to refresh.
    *   Vendor + democracy modules share NotificationLog + EmailAudit; cross-module regression tests ensure updates remain backward compatible.
*   **Data Migration Verification:**
    *   Run `sqlite3 db.sqlite 'PRAGMA integrity_check'` post-migration; export critical tables (BoardMembers, Polls, Votes, Vendors) to CSV and diff against expected seeds.
    *   Perform dry-run migrations in CI using temp volumes; capture logs in artifacts for auditing.
    *   Validate rollback scripts by applying/reverting on staging to prove reversibility before production deployment.
*   **Security & Privacy Validation:**
    *   Confirm CAPTCHA enforcement on board contact + polls via automated tests; log failure responses for review.
    *   Run dependency scanning (npm audit, `docker scan` quarterly) and ensure secrets never logged in CI artifacts.
    *   Review logs for PII redaction compliance (emails hashed, receipts truncated) prior to enabling member access.
*   **CI Observability & Alerting:**
    *   Configure GitHub branch protection requiring successful `ci` and `deploy` workflow statuses; notify Slack/email on failures via workflow `workflow_run` events.
    *   Archive workflow logs for 30 days; include job metadata (duration, caching hits) for trend analysis.
    *   Tag releases with manifest anchor references so operations can trace tasks to plan sections quickly.
*   **Release Checklist Summary:**
    *   Confirm migrations applied + backups taken.
    *   Run `make verify` aggregator (lint/test/audit/playwright/axe/hashchain).
    *   Validate `plan_manifest.json` + docs runbooks updated.
    *   Conduct Go/No-Go with board sponsor, review KPIs + unresolved defects, capture sign-off in `docs/runbooks/go-no-go-checklist.md`.
    *   Post-release monitoring: HealthMonitor cron logs stored, `/metrics` counters observed for anomalies, support channel staffed.

<!-- anchor: glossary -->
## 7. Glossary

*   **Accessibility Suite:** Toggleable collection of high-contrast theme, contextual helper icons, and persistence hooks ensuring residents with vision needs can use the SPA.
*   **AuditEvent:** SQLite table recording admin/critical actions (poll creation, vendor approval, feature flag change) with actor metadata for governance audits.
*   **ConfigRegistry:** Backend helper caching Config table entries for 60s, powering feature flags and operational toggles like board visibility.
*   **Democracy Module:** Poll + voting system featuring informal/binding poll types, hash chain receipts, and verification endpoints.
*   **EmailNotificationService:** Backend service wrapping SendGrid API, responsible for board contact relay, poll notifications, vendor announcements, and logging results to EmailAudit/ResidentNotificationLog.
*   **FeatureFlagAdmin UI:** Admin console interface listing Config keys, values, descriptions, and audit history; used to toggle board visibility, accessibility defaults, polls, vendors.
*   **HealthMonitor:** Cron-invoked script curling `/healthz` + `/metrics`, sending SendGrid alerts when anomalies detected.
*   **High Visibility Mode:** Accessibility theme variant with increased contrast, typography scaling, thicker outlines, and contextual helper icons; activated via navbar toggle or config default.
*   **ResidentNotificationLog:** Table summarizing outbound communications (subject, recipients, timestamp, related entity) to satisfy audit + governance transparency.
*   **VoteIntegrityEngine:** Service/utility computing SHA256 hash chain for votes, storing `prev_hash`, `vote_hash`, and receipt codes to ensure tamper evidence.
*   **Vendor Directory:** Module storing curated provider entries, moderation workflow, guest/member visibility filtering, and optional notification broadcasts when new vendors approved.
*   **Go/No-Go Checklist:** Operational document enumerating release readiness criteria (tests, docs, comms, backups) requiring board sign-off before toggling new features live.
*   **Plan Manifest:** `plan_manifest.json` indexing anchors/sections to make plan machine-addressable for autonomous agents.
*   **Config Flag:** Key/value entry stored in Config table controlling feature visibility (e.g., `board.visibility`, `polls.binding-enabled`, `vendors.public-categories`) with TTL caching + audit logging.
*   **Accessibility Toggle:** Navbar control bound to AccessibilityContext enabling High Vis mode, helper icons, reduced motion settings, and persisted preferences.
*   **Resident Pilot:** Limited cohort of authenticated residents participating in early validation of Accessibility Suite, Democracy module, or Vendor Directory before general release.
*   **Health Gate:** Deploy pipeline step that spins up container, runs migrations, and curls `/healthz`/`/metrics` before pushing image to registry, ensuring runtime readiness.
