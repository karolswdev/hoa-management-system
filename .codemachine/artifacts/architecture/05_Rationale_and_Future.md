<!-- anchor: 4-0-design-rationale -->
## 4. Design Rationale & Trade-offs

The operational blueprint stands on the Medium-scale directives from the foundation document.
All reasoning prioritizes deterministic behavior on a single Linode Nanode using Dockerized monolith deployment.
Simplicity drives every decision, balancing security and transparency for roughly forty households.
The subsections document why the architecture looks the way it does and how future volunteers should reason about changes.

<!-- anchor: 4-1-key-decisions-summary -->
### 4.1 Key Decisions Summary

- **Layered Monolith:** React SPA plus Node.js/Express remain in one repo and container, minimizing ops overhead and aligning with 1GB RAM limits.
  Modularity is preserved through controllers, services, and models, so features can evolve without splitting into microservices.

- **Linode Nanode Hosting:** Target infrastructure is the existing Nanode tier with Ubuntu LTS, ensuring predictable billing and simple SSH access.
  Scaling strategy upgrades vertically only when monitoring shows CPU or RAM saturation.

- **Dockerized Artifact:** A single Docker image built in CI encapsulates runtime dependencies, enabling reproducible deployments and simple rollbacks.
  Multi-stage builds keep the final image lightweight while bundling both backend and SPA assets.

- **SQLite as Primary Database:** SQLite satisfies data needs for ~40 homes while offering low memory usage and simple backup scripts.
  Indexing plans on `Votes`, `BoardMembers`, and `Vendors` ensure queries stay performant despite the lightweight engine.

- **SendGrid Email Integration:** Outbound emails route through SendGrid because the HOA already maintains credentials and the service meets deliverability requirements.
  Email workflows share a central `EmailNotificationService`, simplifying retries, logging, and auditing.

- **Config Table Feature Flags:** Feature exposure is governed via Config table rows cached in-memory with TTL, satisfying the foundation's feature flag mandate.
  Admin UI toggles automatically produce audit events, keeping governance traceable.

- **RBAC Enforcement:** Middleware enforces `guest`, `member`, and `admin` roles, aligning with security directives that protect board history and poll endpoints.
  Board contact forms add captcha validation and rate limiting to shield contact info from spam.

- **Observability Stack:** Pino JSON logs and Prometheus-style `/metrics` deliver the required insight without external SaaS dependencies.
  Health checks become the backbone for CI/CD verification, HealthMonitor cron, and manual diagnostics.

- **Vote Integrity Model:** Democracy Module uses SHA256 hash chains, sequential transactions, and receipt verification endpoints to satisfy transparency obligations.
  Informal polls and binding votes share the same infrastructure, with feature flags gating enforcement levels.

- **Accessibility Context & Theme Engine:** Accessibility Suite uses React Context, `createAppTheme`, and high-visibility presets to promote inclusive UX without forking components.
  LocalStorage persistence honors guest sessions while syncing to user profiles when authenticated.

- **CI/CD Hardening:** GitHub Actions remains the single pipeline of record, now augmented with npm audit and docker health checks before any image push.
  Manual deployment approvals ensure board oversight and align with governance policies.

- **Health Endpoint Standardization:** `/healthz` and `/metrics` provide consistent JSON and Prometheus formats required by deployments, cron monitors, and troubleshooting scripts.
  Tooling depends on these contracts, so they became first-class citizens early in the design.

<!-- anchor: 4-2-alternatives-considered -->
### 4.2 Alternatives Considered

The team evaluated several enticing alternatives but rejected each when mapped against constraints and volunteer skill sets.
Documenting these trade-offs ensures future contributors understand the rationale before revisiting them.

- **Microservices or Serverless Functions:** Splitting the monolith could isolate board, poll, and vendor modules, yet it would require multiple deploy units, observability stacks, and inter-service auth.
  Given the Nanode resource cap and minimal headcount, the operational overhead outweighed theoretical benefits, so the layered monolith stayed.

- **Managed Database (PostgreSQL, MySQL):** Hosted databases would provide richer concurrency controls, but they add monthly costs and network hops while complicating backups.
  SQLite already meets performance needs, and planned indexes plus locking strategies mitigate the identified contention areas.

- **Third-Party Monitoring Suites:** Tools like Datadog or New Relic were considered for richer dashboards, yet licensing, agent overhead, and configuration complexity conflicted with the simplicity directive.
  Structured logs and `/metrics` endpoints offer enough observability for the HOA size.

- **External Email Queues or Workers:** Introducing RabbitMQ or managed queues would break the "no extra services" rule and demand new operational expertise.
  Synchronous SendGrid calls with retries achieved acceptable reliability without a new fleet.

- **Cloud Email Aliases Instead of SendGrid:** Relying on generic Gmail aliases risked spam filters and lacked API-level observability.
  SendGrid's webhook data and API keys provide higher deliverability and auditing despite slight complexity.

- **External Identity Providers:** OAuth providers (Google, Auth0) were considered to offload auth, but they introduce user friction and recurring fees.
  The existing session/JWT mechanism remains sufficient for the resident base and keeps operations self-contained.

- **Multi-Host Deployment:** Running separate frontend and backend droplets seemed like a path to better isolation, yet doubling infrastructure would stretch volunteers and budgets.
  Docker-based single-host deployment already provides isolation boundaries and faster recovery for this scale.

<!-- anchor: 4-3-known-risks-mitigation -->
### 4.3 Known Risks & Mitigation

Pragmatic architecture still carries operational and security risks that must be tracked.
Each risk below pairs with mitigation steps documented in runbooks and Config policies.

- **Single-Host Failure:** Linode Nanode is a single point of failure; power or network outages take down all modules.
  Mitigation: nightly SQLite dumps, weekly snapshots, and documented restoration steps keep recovery within the four-hour RTO.

- **SQLite Concurrency Contention:** Binding polls could create write hotspots causing `database is locked` errors.
  Mitigation: transactions run in `IMMEDIATE` mode, controllers retry on contention, and user messaging encourages staggering votes if necessary.

- **SendGrid Dependency:** If SendGrid credentials leak or the service fails, residents lose board contact and notification capabilities.
  Mitigation: rotate API keys quarterly, store them only in env vars, and fall back to manual Gmail distribution lists documented in emergency guide.

- **Feature Flag Misconfiguration:** Incorrect Config changes might expose board history publicly or disable security features.
  Mitigation: admin UI requires justification notes, audit trails log changes, and release playbooks include validation steps for sensitive flags.

- **Volunteer Turnover:** Knowledge loss may lead to misconfigured deployments or delayed incident response.
  Mitigation: maintain `.codemachine` docs, conduct quarterly knowledge-sharing sessions, and ensure at least two board members can deploy independently.

- **Hash Chain Complexity:** Buggy hash implementations could undermine trust in binding votes.
  Mitigation: dedicated Jest tests cover `vote.service`, code logs each computed hash, and receipts can be recalculated via CLI to prove integrity.

- **Accessibility Regression Risk:** High-visibility theme changes might create layout issues if not tested widely.
  Mitigation: feature flags roll out gradually, snapshot tests assert theme tokens, and admin UI offers quick rollback.

- **Resource Exhaustion:** Memory spikes from large attachments or data exports can push Node beyond 512MB, causing restarts.
  Mitigation: limit payload sizes, stream exports, and monitor `RSS` via `/metrics` for early warnings.

- **Data Privacy Breach:** Accidental exposure of board contact emails or vendor notes would erode resident trust.
  Mitigation: redact sensitive logs, encrypt backups with `gpg`, and enforce least privilege on SSH keys and GitHub access.

- **Manual Deployment Drift:** Skipping documented steps (e.g., migrations, feature flag verification) could result in inconsistent production state.
  Mitigation: deploy checklist requires sign-off from two operators, and GitHub Actions artifacts store manifest metadata for cross-checks.

<!-- anchor: 5-0-future-considerations -->
## 5. Future Considerations

Looking ahead, the HOA should plan for growth scenarios even while operating within today's constraints.
These considerations prioritize incremental evolution and areas requiring deeper design exploration.

<!-- anchor: 5-1-potential-evolution -->
### 5.1 Potential Evolution

- **Automated Resident Notification Log:** Expand EmailAudit into dashboards so residents can self-serve message history, reducing manual reports.
- **Profile-Linked Accessibility Preferences:** Sync Accessibility context to user profiles so preferences follow residents across devices without manual toggles.
- **Expanded Democracy Analytics:** Add charts summarizing poll participation trends, enabling the board to calibrate outreach strategies.
- **Mobile-Optimized Admin Console:** Refine admin pages for smaller screens, enabling in-field vendor updates during community walks.
- **Modularized Email Templates:** Introduce JSON-based templates stored in SQLite to allow board-led copy updates without redeploying code.
- **Cron-Driven Reminder System:** Use existing cron plus HTTP endpoints to trigger reminders (dues, events) while respecting no-new-services rule.
- **Optional Data Warehouse Export:** Provide nightly CSV exports to board cloud storage, laying groundwork for future analytics if the HOA grows.
- **Resident-Facing Metrics Dashboard:** Publish aggregate KPIs (poll turnout, accessibility usage) on member portal pages to reinforce transparency.

Each evolution idea honors the monolith constraint and reuses existing modules, staying within operational comfort zones.

<!-- anchor: 5-2-areas-deeper-dive -->
### 5.2 Areas for Deeper Dive

Some roadmap tasks require additional discovery and documentation before execution.
Focusing on these areas will reduce delivery risk and align expectations with available volunteer time.

- **CI/CD Secret Rotation Playbooks:** Document step-by-step guidance for rotating GHCR tokens and SendGrid keys inside GitHub Actions and Linode.
- **Poll Hash Verification Tooling:** Build CLI or admin UI features that recompute hash chains for selected polls and compare results, aiding audits.
- **Accessibility Usability Testing:** Schedule resident sessions to validate high-visibility theme choices and contextual help placement.
- **Vendor Moderation Workflow:** Flesh out approval process, notification templates, and dispute resolution steps tied to audit events.
- **Rate Limiting Calibration:** Simulate traffic spikes to fine-tune IP-based throttles, ensuring board contact forms remain usable but safe.
- **HealthMonitor Alert Escalation:** Define thresholds and response SLAs so alerts reach the right people without alarm fatigue.
- **Config Flag Taxonomy:** Create a taxonomy document describing naming conventions, default values, and dependencies to reduce misconfiguration risk.
- **Disaster Recovery Automation:** Prototype scripts that spin up replacement Linode instances, restore backups, and validate `/healthz` with minimal manual commands.

Deliverables from these deep dives should include diagrams, code snippets, and rollout plans kept under version control.

<!-- anchor: 6-0-glossary -->
## 6. Glossary

- **Accessibility Suite:** Collection of high-visibility theme, contextual help icons, and settings persistence built into the React SPA.
- **AuditEvent:** SQLite table capturing actor, entity, and metadata for sensitive operations such as feature flag toggles and vendor edits.
- **Config Registry:** Backend helper that reads/writes Config table values with 60-second cache, powering feature flags and operational toggles.
- **Feature Flag Admin UI:** Admin console widget that surfaces Config keys, current states, and justification fields for every toggle.
- **GHCR (GitHub Container Registry):** Registry hosting the Docker image artifact produced by GitHub Actions workflows.
- **HealthMonitor:** Lightweight cron-invoked script that curls `/healthz` and `/metrics`, emailing alerts via SendGrid when status degrades.
- **High-Visibility Mode:** Accessibility theme variant with increased font sizes, contrast adjustments, and helper icon surfacing.
- **Linode Nanode:** Single-tenant 1GB RAM VPS used as production host, running Dockerized monolith.
- **ResidentNotificationLog / EmailAudit:** SQLite tables storing outbound communication metadata for accountability.
- **SendGrid:** Third-party email API used for board contact routing, poll notifications, and health alerts.
- **Vote Receipt:** Hash output from the Democracy Module proving a vote was recorded; can be re-verified via dedicated API.
- **Hash Chain:** Sequential SHA256 linkage of vote metadata ensuring tamper detection by referencing previous vote hash per record.

These definitions align volunteer vocabulary with the artifacts referenced throughout the operational architecture.
