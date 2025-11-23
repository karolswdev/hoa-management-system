<!-- anchor: 3-0-proposed-architecture-operational -->
## 3. Proposed Architecture (Operational View)

The operational view codifies how the HOA Management System persists real-world reliability on a constrained Linode Nanode footprint.
It applies every directive from the foundation document, ensuring the layered monolith remains stable, secure, and maintainable by volunteer operators.
It describes the end-to-end lifecycle from code packaging to observability, emphasizing the "Simplicity, Stability, Security" mantra.
Each subsection provides actionable guardrails and concrete instructions that can be executed without guesswork.

<!-- anchor: 3-1-operational-priorities-scope -->
### 3.1 Operational Priorities & Scope

Operational priorities revolve around delivering board governance, democracy tooling, and accessibility upgrades without exceeding the 1GB RAM ceiling.
Scope includes frontend React SPA, backend Node.js API, SQLite datastore, SendGrid integration, and GitHub Actions automation.
Every feature is independently deployable behind feature flags stored in the Config table.
Volunteer operators require human-readable runbooks, so each process is documented with precise sequences.
Operational policies assume a single production Linode Nanode, plus developer laptops running Docker for local validation.
The roadmap enumerates small-scope modules, so capacity planning uses daily active residents < 60, ensuring SQLite suffices.
Outputs of each pipeline stage must be verifiable offline in case the HOA laptop loses connectivity.
Release gates depend on CI success along with manual verification of `/healthz` since no managed monitoring exists.
Change windows are scheduled for evenings when resident traffic is low, but the system must retain availability throughout.
- `board_visibility` flag defaults to `members_only` on production until admins explicitly publish the roster, preventing accidental guest exposure.
- Accessibility Suite rollouts start with admin opt-in, using Config keys `ui.accessibility-high-vis-default` and `ui.accessibility-help-tooltips` to gate UI.
- Democracy module endpoints remain member-only, with informal polls enabled before binding votes to validate the hash chain process incrementally.
- Vendor Directory content is cached in memory for 60 seconds, balancing freshness with CPU conservation on the Nanode.
- CI pipelines enforce npm audit at critical level, blocking merges whenever vulnerabilities exceed policy thresholds.
- Admin-only API routes require `role=admin` session claims, with middleware logging each invocation to the audit table.
- Operational scope forbids introducing external queues or background workers, so email sends run synchronously with backoff inside request threads.
- SQLite remains the authoritative database; backups rely on nightly `sqlite3 .dump` exports triggered by cron on the Linode host.
- Health monitoring uses `/healthz` and optional `/metrics`, pinged by GitHub Actions and the lightweight HealthMonitor script.
- Operator tooling leverages `docker compose` locally, mirroring the production Dockerfile to preempt runtime drift.

<!-- anchor: 3-2-environment-baseline -->
### 3.2 Environment Baseline

The production environment is a single Linode Nanode (1GB RAM, 1 vCPU, 25GB SSD) running Ubuntu LTS with Docker Engine and docker-compose.
Node.js 18 LTS and SQLite 3.35+ are bundled within the container image to isolate dependencies from the host OS.
The React SPA builds into static assets served by the Express server behind the same container to avoid extra services.
Nginx is not introduced to honor the simplicity directive; Express terminates HTTPS behind the Linode-managed TLS certificate.
The host enforces firewall rules exposing ports 22 and 443 only, with ufw configured to drop other inbound traffic.
Swap is capped at 512MB to prevent thrashing; Node's memory usage is tuned via `NODE_OPTIONS=--max-old-space-size=384`.
Docker data-root resides on the Linode disk, and old images are pruned after each deploy to stay under the 1GB compressed limit.
- Operating system patching occurs monthly using unattended-upgrades, with manual verification after kernel patches.
- Docker daemon is pinned to stable channel, and `daemon.json` disables legacy registries to prevent accidental pulls.
- Host-level logs rotate via `logrotate` with 7-day retention to protect disk space for application data.
- Time synchronization uses systemd-timesyncd to keep vote timestamps reliable for the hash chain.
- A dedicated Linux user `hoaapp` owns deployment directories, reducing blast radius for compromised accounts.
- SSH access requires key-based auth; password logins are disabled, and sudo privileges are restricted to two board admins.
- Environment variables are stored in `/etc/hoa/.env` with `chmod 600`, loaded by docker-compose during container start.
- SQLite database file lives under `/var/lib/hoa/db.sqlite` and is bind-mounted into the container read-write.
- HealthMonitor script runs hourly via cron, curling `/healthz` and emailing anomalies through SendGrid.
- Emergency maintenance window instructions are printed and stored in the HOA clubhouse binder for offline accessibility.

<!-- anchor: 3-3-deployment-artifacts-pipeline -->
### 3.3 Deployment Artifacts & Pipeline

Deployment artifacts revolve around a single Docker image published to GitHub Container Registry (GHCR).
CI and deploy workflows run within GitHub Actions, triggered by pushes to `main` and manual approval for production tags.
Vite builds the frontend during docker build, generating static assets within `frontend/dist`.
Backend tests and lint run before image build to catch regressions early.
npm audit at `--audit-level=critical` executes inside CI and fails the job if issues exist.
A temporary docker run and `/healthz` curl gate the push to GHCR, mirroring production runtime in isolation.
- Step 1: GitHub Actions checks out the repo using shallow clone to conserve pipeline minutes.
- Step 2: Node.js matrix pinned to 18.x installs dependencies with `npm ci` for backend and `frontend` directories.
- Step 3: Lint and Jest suites run with coverage thresholds focusing on new controllers, services, and Accessibility context.
- Step 4: `npm audit --audit-level=critical` runs at repository root to enforce security posture.
- Step 5: Docker build uses multi-stage strategy to keep runtime image slim and caches dependencies by layer.
- Step 6: Post-build test stage runs `docker run` to start the container, seeds SQLite with migrations, and curls `/healthz`.
- Step 7: On success, the image is tagged `ghcr.io/hoa/management-system:<git-sha>` and `latest`, then pushed.
- Step 8: Deployment workflow logs into the Linode host via SSH, pulls the new version, and restarts the container with zero-downtime strategy.
- Step 9: After restart, the workflow re-curls `/healthz` and `/metrics` remotely, capturing logs for later audits.
- Step 10: Release notes and feature flag toggles are updated via admin UI, ensuring documentation matches runtime state.
Operators maintain a manual hotfix path that reuses the same Docker build but tags images with `hotfix-<date>` for traceability.
Rollback relies on `docker image ls` history and reapplying the previous compose file, taking under five minutes.
Seed data and migrations execute via `npm run migrate` inside the container, guaranteeing schema parity after each deploy.
All pipeline secrets (GH_TOKEN, CI_REGISTRY_TOKEN, SENDGRID_API_KEY) stay in GitHub Actions secrets with least-privilege scopes.

<!-- anchor: 3-4-runtime-configuration-secrets -->
### 3.4 Runtime Configuration & Secrets

Runtime configuration combines environment variables and Config table flags.
Environment variables handle sensitive data like SendGrid keys, session secrets, and admin email lists.
The Config table stores feature toggles and operational parameters, cached in-memory with 60s TTL.
Application start logs emit sanitized summaries of enabled flags for traceability.
Secret rotation process is manual yet scripted to reduce operator mistakes.
- Secrets reside in `/etc/hoa/.env` and are templated from `.env.example` stored in the repo without actual values.
- The docker-compose file references env vars via `${VAR}` syntax, preventing accidental baking into the image.
- Key variables include `SENDGRID_API_KEY`, `SESSION_SECRET`, `HASH_SALT`, `BOARD_CONTACT_RATE_LIMIT`, and `CI_REGISTRY_TOKEN`.
- Config table entries follow `domain.feature-name` naming, e.g., `board.visibility`, `ui.accessibility-high-vis`, `polls.binding-enabled`.
- Backend exposes `/config/flags` for the frontend to initialize contexts; responses include TTL metadata for caching.
- Admin UI writes to Config via dedicated endpoints that also create entries in `FeatureFlagAudit`.
- Secrets rotation occurs quarterly or after incidents; scripts update `.env`, restart containers, and verify `/healthz`.
- Sensitive logs (email payloads) are redacted before being persisted to `EmailAudit` and before shipping to stdout.
- No secrets are stored inside SQLite; hashed tokens reference secrets only indirectly.
- Operators track configuration drift using Git-tracked `.ops/env-template.md` describing expected keys and default states.
Config caching uses Node's in-memory object guarded by mutex to prevent concurrent refresh storms.
If cache misses occur frequently, TTL can be reduced via Config without redeploying.

<!-- anchor: 3-5-data-layer-migration-discipline -->
### 3.5 Data Layer & Migration Discipline

SQLite remains the authoritative store for board rosters, polls, votes, vendors, and config flags.
Migrations are written in SQL files executed sequentially via a Node migration runner.
Schema additions include indexes on `BoardMembers.title_id`, `Votes.poll_id`, and `Vendors.service_category`.
All PII columns enforce NOT NULL constraints where applicable and record timestamps for auditing.
Vote hash chains rely on deterministic insertion order, enforced via transactions and `BEGIN IMMEDIATE`.
- Migration naming uses `YYYYMMDDHHMM_<description>.sql` to maintain chronological order for sqlite3.
- Each migration is idempotent; guard clauses (`IF NOT EXISTS`) prevent reapplication issues on staging.
- After migrations run, `PRAGMA integrity_check` executes inside CI to ensure database consistency.
- Seed scripts insert baseline board titles, vendor categories, and feature flag defaults.
- Backup routine exports `sqlite3 db.sqlite .dump` nightly, compressing outputs and rotating 14 days of archives.
- Local developers run migrations via `npm run migrate:dev`, which checks for pending files before server start.
- Democracy module uses table locking by starting transactions in `IMMEDIATE` mode, preventing concurrent writers.
- Vote receipts include `receipt_code` column containing hashed data; queries index by this column for verification API.
- Vendor Directory caches query results for 60 seconds using Node's `Map` plus TTL to reduce DB pressure.
- Board history queries filter by date range and paginate to avoid heavy memory usage when history length grows.
Data retention policies forbid deleting votes; correction uses compensating entries referencing previous hash in metadata.
When legal deletion is required, a tombstone record is inserted and referenced in `AuditEvent` for traceability.

<!-- anchor: 3-6-service-operations-scheduling -->
### 3.6 Service Operations & Scheduling

Service operations cover runtime behaviors such as scheduling, email dispatches, and maintenance tasks.
No background workers exist, so synchronous flows need careful throttling.
SendGrid API calls include retries and log outcomes to `EmailAudit`.
Cron tasks run on the host to backup SQLite and ping health endpoints.
- API rate limiting uses Express middleware keyed on IP, with board contact form applying stricter thresholds and captcha validation.
- Email sends wrap `sendgrid.send` in a helper that retries twice with exponential backoff (250ms, 500ms), logging failures.
- Cron schedule: `0 3 * * *` for database dumps, `*/60 * * * *` for HealthMonitor pings, `15 4 * * 0` for log rotation.
- Accessibility preferences stored in localStorage sync to backend when users authenticate, executed via `/preferences/accessibility`.
- Feature flag cache refresh occurs via cron hitting `/admin/refresh-flags`, secured behind admin token.
- Service restarts use `docker compose up -d --pull always`, ensuring host uses latest image before replacing running container.
- Pre-deploy scripts snapshot `/var/lib/hoa/db.sqlite` for ad-hoc rollback without replaying migrations.
- Operators maintain `ops/playbooks.md` describing response steps when `HealthMonitor` detects errors.
- Session tokens expire after 12 hours; stale cookies are pruned by frontend on login to reduce invalid requests.
- Captcha verification uses a lightweight token service already in the monolith; tokens expire in 10 minutes to discourage spamming.
All scheduled tasks log start and completion events to `ops-cron.log`, enabling forensic review.
Manual operational audits occur quarterly to confirm cron entries align with documented expectations.

<!-- anchor: 3-7-observability-health -->
### 3.7 Observability & Health Management

Observability relies on structured logging and lightweight metrics since no external SaaS is approved.
Pino logger outputs JSON with request IDs, user IDs when available, and feature flag snapshots for board responses.
`/healthz` endpoint checks DB connectivity, feature flag cache freshness, and SendGrid availability.
`/metrics` exposes Prometheus text including request counts, vote hash chain latency, and email success ratio.
- Each incoming request receives `req.id` generated via `nanoid` and propagated to downstream logs.
- Logger redacts sensitive fields like emails, message bodies, and captcha tokens to comply with privacy expectations.
- Hash chain operations log the computed receipt hash plus prior hash reference, aiding audits without exposing user IDs.
- Error handling middleware categorizes errors (client, server, dependency) and increments counters exposed under `/metrics`.
- HealthMonitor script parses `/healthz` JSON and raises alerts via SendGrid if status != `ok`.
- Frontend dev mode uses `console.groupCollapsed` to log React Query cache events when high-visibility mode toggles.
- Accessibility context updates emit custom events for analytics, allowing admins to gauge adoption.
- Vendor Directory caches expose hit/miss counts for quick troubleshooting of stale data issues.
- Observability pipeline retains logs on disk for 7 days; a nightly job compresses older logs and removes after retention.
- Audit tables store email dispatch events, board contact submissions, and feature flag changes with actor metadata.
Operators periodically run `curl https://hoa.example.com/metrics` to verify metrics format remains parseable.
All monitoring scripts require minimal dependencies (curl, jq) to remain maintainable on resource-limited host.

<!-- anchor: 3-8-cross-cutting-concerns -->
### 3.8 Cross-Cutting Concerns

- **Authentication & Authorization:** Existing session or JWT mechanism issues tokens, with middleware verifying signatures on every route.
  Role-based access control enforces `member`, `admin`, and `guest` scopes; board history and poll endpoints require at least `member`.
  Admin endpoints double-check `role=admin` plus `X-Admin-Feature-Flag` header when toggling Config entries to prevent CSRF.

- **Logging & Monitoring:** Backend uses pino to output JSON logs with timestamps, request IDs, and feature flag states into stdout collected by Docker.
  `/metrics` publishes Prometheus counters scraped manually or by lightweight collectors, while GitHub Actions health checks rely on `/healthz`.
  Alerting uses SendGrid to notify board admins with structured payloads when HealthMonitor detects anomalies.

- **Security Considerations:** HTTPS terminates via Linode-managed certificates, Express enforces HSTS, and all cookies use `Secure` and `HttpOnly`.
  Inputs undergo schema validation via zod/joi, captcha tokens protect board contact, and vote hashing uses `crypto.createHash('sha256')`.
  Secrets stay in env vars, `docker scan` runs quarterly, and npm audit ensures dependencies meet the critical threshold.

- **Scalability & Performance:** Application remains stateless aside from SQLite, enabling horizontal scaling if a larger Linode is provisioned later.
  React Query caches API responses to reduce redundant fetches, while backend caches Config values for 60 seconds to minimize DB hits.
  Vote hashing executes asynchronously yet sequentially inside transactions, keeping CPU usage manageable even during community-wide polls.

- **Reliability & Availability:** Health checks run before and after deployments, and the container restarts automatically on failure via docker-compose `restart: unless-stopped`.
  Nightly DB dumps and on-demand snapshots provide recovery options, while audit logs allow forensic reconstruction after incidents.
  No single script performs destructive actions; operators follow documented playbooks that include verification steps for each change.

<!-- anchor: 3-9-deployment-view -->
### 3.9 Deployment View

The deployment view provides end-to-end mapping from GitHub Actions to the Linode Nanode runtime.
It clarifies artifact flow, runtime topology, and network boundaries so operators can reason about failure modes quickly.

<!-- anchor: 3-9-1-target-environment -->
#### 3.9.1 Target Environment

Target platform is Linode Nanode 1GB located in the closest region to the HOA to minimize latency.
The host runs Ubuntu 22.04 LTS, Docker Engine 24.x, docker-compose v2 plugin, ufw firewall, and cron.
DNS records point `hoa.example.com` to the Linode IP, and TLS certificates use Let's Encrypt managed via `certbot`.
Operators maintain console access through Linode Cloud Manager for out-of-band recovery.
- Single availability zone keeps costs low; backups rely on snapshots stored within Linode's block storage.
- Node.js container listens on port 8080 internally; host-level reverse proxy maps 443 to container via docker-compose port binding.
- `/var/lib/hoa` bind mounts persist SQLite database and uploaded assets outside the container lifecycle.
- System metrics (CPU, RAM) monitored using `linode-cli` or Linode dashboard, complementing app-level metrics.
- Host uses fail2ban to block repeated SSH failures, reducing attack surface.

<!-- anchor: 3-9-2-deployment-strategy -->
#### 3.9.2 Deployment Strategy

Deployment strategy retains a single Docker container orchestrated by docker-compose on the Linode host.
Releases follow rolling pattern: pull new image, run migrations, restart container, verify health, toggle feature flags.
No downtime is expected because Node server starts within seconds and migrations execute quickly on SQLite.
Feature flags allow dark launching modules before enabling UI entry points.
- Operators SSH into host using key-based auth and navigate to `/opt/hoa`.
- `docker compose pull app` fetches new GHCR image using stored PAT.
- `docker compose run --rm app npm run migrate` applies schema updates before traffic hits new code.
- `docker compose up -d app` restarts container with new build and cleans up old containers.
- Immediately run `docker compose logs app --tail 50` to ensure startup succeeded without errors.
- Execute `curl -f https://hoa.example.com/healthz` and `curl -f https://hoa.example.com/metrics` to confirm readiness.
- Toggle relevant Config flags through admin UI, referencing release notes to avoid mismatches.
- Document deployment in `ops/deploy-log.md`, capturing version, operator, and verification steps.

<!-- anchor: 3-9-3-deployment-diagram -->
#### 3.9.3 Deployment Diagram

~~~plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml
Deployment_Node(ci, "GitHub Actions", "CI/CD", "Lint, test, audit, build")
Deployment_Node(registry, "GitHub Container Registry", "GHCR", "Stores versioned Docker images")
Deployment_Node(linode, "Linode Nanode", "Ubuntu 22.04 + Docker", "1GB RAM host") {
  Container(app, "HOA Monolith Container", "Node.js 18 + Express + React", "Serves API, SPA, handles SendGrid")
  ContainerDb(sqlite, "SQLite Database", "db.sqlite bind mount", "Board, Polls, Votes, Vendors")
}
System_Ext(sendgrid, "SendGrid", "Email API")

Rel(ci, registry, "Push image", "docker push")
Rel(ci, linode, "Trigger deployment via SSH", "docker compose pull/up")
Rel(linode, app, "Runs container", "docker")
Rel(app, sqlite, "Read/write", "sqlite3 over bind mount")
Rel(app, sendgrid, "Send notifications", "HTTPS 443")
@enduml
~~~

<!-- anchor: 3-9-4-operational-steps -->
#### 3.9.4 Operational Deployment Steps

Operational runbooks convert the deployment diagram into actionable tasks, ensuring reproducible releases.
- Confirm GitHub Actions build succeeded and GHCR image exists using `docker pull` dry run locally.
- SSH into Linode and run `df -h` to ensure at least 2GB free disk before pulling image.
- Execute `docker compose ps` to capture current container ID for rollback reference.
- Run migrations using new image but without exposing traffic by invoking `docker compose run --rm app npm run migrate`.
- Restart service and watch logs for schema mismatch or SendGrid connectivity issues.
- Validate board roster endpoints (`/board`, `/board/history`) for expected visibility behavior aligned with Config.
- Submit test board contact form using captcha token to confirm SendGrid integration.
- Cast a test informal poll vote, record receipt hash, and verify via `GET /polls/{id}/receipts/{hash}`.
- Toggle Accessibility Suite flag via admin UI and refresh frontend to ensure theme fetch occurs.
- Update `ops/deploy-log.md` with success status, version hash, operator, and any anomalies.

<!-- anchor: 3-10-operational-controls-maintenance -->
### 3.10 Operational Controls & Maintenance

Operational controls guard against drift and ensure the HOA can maintain the platform without external vendors.
Maintenance tasks focus on patching, backups, flag reviews, and documentation updates.
Board-approved volunteers enforce segregation of duties: one initiates deployments, another reviews logs.
- Monthly patch cycle updates Ubuntu packages, Docker Engine, and Node dependencies; results logged in `ops/maintenance-log.md`.
- Feature flag reviews occur quarterly to retire stale toggles and document rationale for defaults.
- Backup validation runs weekly by restoring `.dump` file into dev container and replaying migrations.
- Access reviews confirm only active board members retain SSH keys and GitHub repository permissions.
- Cron job statuses checked via `systemctl status cron` and `journalctl -u cron` to detect failures early.
- SendGrid dashboard monitored for bounces or rate limit warnings, with adjustments documented.
- Accessibility high-visibility metrics reviewed to tailor future UX enhancements.
- Vendor Directory submissions audited monthly to ensure no stale contact information remains.
- Disaster recovery drills simulate host failure by restoring snapshot onto test Linode.
- Operational documentation stored under `.codemachine/artifacts` and printed for offline reference.
These controls keep operations auditable and shareable when board roles change annually.
All updates require two-person verification recorded in meeting minutes for governance transparency.

<!-- anchor: 3-11-disaster-preparedness-recovery -->
### 3.11 Disaster Preparedness & Recovery

Disaster readiness emphasizes fast recovery from host failure, data corruption, or security incidents.
Given budget constraints, strategy focuses on scripted restores and manual verification.
- Linode snapshots captured weekly provide full-system rollback; instructions stored in `ops/disaster-recovery.md`.
- Nightly SQLite dumps replicate off-host via `scp` to secure cloud storage owned by the treasurer.
- Recovery drill: provision temporary Linode, install Docker, copy `.env` and latest dump, run migrations, verify `/healthz`.
- Incident response plan defines roles (Incident Lead, Communications, Scribe) to keep residents informed.
- Compromise scenarios require rotating SendGrid keys, session secrets, and forcing logout by clearing cookie secrets.
- Vote hash chain integrity verified post-incident by re-running hash computations and comparing to stored receipts.
- Vendor Directory can be temporarily disabled via feature flag if data integrity is questioned.
- HealthMonitor alerts escalate to SMS when email unavailable; fallback uses HOA group chat for manual outreach.
- Post-incident review template ensures lessons learned feed into documentation updates.
- Recovery time objective targeted at <4 hours, recovery point objective <24 hours thanks to nightly dumps.
Because data volumes are small, dry runs can be executed quarterly without major cost.
Documentation includes screenshots and CLI transcripts to help less technical volunteers perform the steps confidently.

<!-- anchor: 3-12-documentation-knowledge-transfer -->
### 3.12 Documentation & Knowledge Transfer

Sustainable operations require accessible documentation for both technical and non-technical stakeholders.
Knowledge transfer occurs at board transitions, ensuring continuity despite volunteer turnover.
- `.codemachine/artifacts/architecture` hosts canonical operational and rationale docs, synced with Git history.
- `ops/runbooks/*.md` detail task-specific instructions (deployments, backups, captcha resets).
- Video walk-throughs recorded with open-source tools demonstrate UI flag toggles and health validations.
- Admin UI screens include tooltips referencing doc sections via anchor IDs for quick cross-navigation.
- Regular lunch-and-learn sessions review democracy module internals, demystifying hash receipts for board members.
- Issues and pull requests reference doc anchors to keep context centralized.
- Change logs highlight operational impacts (new cron jobs, env vars) to avoid surprises.
- A handover checklist ensures departing admins rotate keys, transfer SendGrid ownership, and archive Slack threads.
- Printed cheat-sheets stored physically help during network outages or emergencies.
- Feedback loops allow residents to request clarifications, and docs are updated within two weeks per governance policy.
Documentation remains living material; every release requires a doc diff review before merging.
This ensures the operational architecture never drifts from reality and remains understandable by the HOA community.

<!-- anchor: 3-13-operational-metrics-kpi -->
### 3.13 Operational Metrics & KPIs

Measuring the platform's health requires a concise KPI set that board members can interpret without a data warehouse.
Metrics derive from `/metrics`, audit tables, and manual monthly rollups exported to spreadsheets.
KPIs align with roadmap goals: transparent governance, accessible UX, and responsive communications.
- **Board Engagement Rate:** count of board roster page views by members divided by total active members per month.
- **Accessibility Adoption:** percentage of sessions with high-visibility mode enabled; tracked via frontend events and Config toggles.
- **Poll Participation:** ratio of unique voters to eligible members, separately measured for informal and binding polls.
- **Vote Receipt Verification:** number of receipts looked up via API, indicating resident trust and audit activity.
- **Email Success Rate:** SendGrid delivery minus bounce percentage; alerts fired if below 98%.
- **Health Check Pass Rate:** fraction of hourly cron pings returning HTTP 200; target is 99% or greater.
- **Vendor Directory Freshness:** days since last vendor update; if >90 days, admin reminder triggers.
- **Average Response Time:** Express middleware records p95 latencies per endpoint, ensuring Node remains responsive under load.
- **Config Drift Count:** number of Config keys changed per month; spikes prompt documentation reviews.
- **CI Success Ratio:** builds passing on first attempt; low ratio indicates flaky tests needing attention.
KPIs are summarized in monthly ops reports shared with residents to reinforce transparency.
Raw metrics remain in SQLite or log files, enabling reproducible analysis without SaaS dependencies.

<!-- anchor: 3-14-compliance-privacy-operations -->
### 3.14 Compliance & Privacy Operations

Compliance practices focus on privacy of resident data and adherence to HOA bylaws governing communications.
While no formal regulatory framework applies, the system treats data with HOA-internal confidentiality standards.
Operational activities ensure policies stay enforced through automation and documented reviews.
- Audit tables log every admin change, including feature flag toggles, vendor updates, and poll creations, capturing actor IDs and timestamps.
- Board contact emails store hashed versions of requestor email addresses to support abuse investigations without exposing plaintext.
- Residents can request data exports via admin UI; operators run a script that queries SQLite and packages JSON plus PDF summary.
- Access to SQLite dumps is limited to treasurer and president, with encryption performed using `gpg` before offsite transfer.
- Email notifications include unsubscribe instructions referencing HOA bylaws section numbers for clarity.
- Captcha tokens stored for board contact expire after 24 hours and are purged via nightly script.
- Logs older than 90 days are deleted automatically unless flagged for an ongoing governance dispute.
- Vendor submissions require admin approval; moderation decisions recorded to `AuditEvent` for fairness tracking.
- Privacy incidents (e.g., misdirected email) trigger board review and resident notification within 72 hours.
- Compliance checklist reviewed during annual HOA meeting, ensuring community visibility into data stewardship.
These practices keep the small-scale system aligned with community expectations, even without external auditors.
Documented procedures also aid future migrations should the HOA outgrow the single host model.
