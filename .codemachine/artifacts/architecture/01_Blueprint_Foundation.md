<!-- anchor: 01-blueprint-foundation -->
# 01_Blueprint_Foundation.md

<!-- anchor: 1-0-project-scale-directives -->
### **1.0 Project Scale & Directives for Architects**

*   **Classification:** Medium
*   **Rationale:** The scope blends several coordinated modules (board governance, accessibility tooling, voting integrity, vendor directory) plus CI/CD upgrades, but target deployment remains a single Linode host with SQLite and a ~40 household audience, aligning with a focused MVP-level extension rather than a full enterprise program.
*   **Core Directive for Architects:** This is a **Medium-scale** roadmap; all solutions MUST emphasize rapid delivery, pragmatic reuse of the existing layered monolith, and defense-in-depth security without introducing needless distributed-system complexity or third-party dependencies that exceed the Linode footprint.
*   **Priority Delivery Mindset:** Architectural decisions MUST favor deterministic behavior, low-ops burden, and documentation that allows HOA volunteers to maintain features after handoff, even when institutional knowledge is minimal.
*   **Success Criteria:** Each domain enhancement must be independently releasable under feature flags, backward-compatible with current user journeys, and verifiable via lightweight tests that run within the 1GB constraint.
*   **Coordination Expectation:** Specialized architects must cross-reference this foundation document before proposing any divergence; disagreements are resolved in favor of the constraints written here to prevent architectural drift.

---

<!-- anchor: 2-0-standard-kit -->
### **2.0 The "Standard Kit" (Mandatory Technology Stack)**

*   **Architectural Style:** Opinionated layered monolith (React SPA + Node.js/Express API) with disciplined module boundaries; no microservices or background workers beyond lightweight cron tasks already supported by the host.
*   **Frontend:** React with Vite build chain and Material UI; continue TypeScript usage, integrate Accessibility Context + feature-flag hooks, and enforce tree-shaking to keep bundle sizes manageable for residents on slower devices.
*   **Backend Language/Framework:** Node.js 18 LTS with Express controllers and service modules; forbid ad-hoc scripts—business logic must live inside `services/` with dependency injection to facilitate testing.
*   **Database(s):** SQLite as the authoritative datastore; every schema change must include migration scripts plus pragmatic indexing (e.g., on `Votes.poll_id`, `BoardMembers.title_id`) to preserve query performance on shared memory.
*   **Cloud Platform:** Linode Nanode tier; all solutions must assume a single compute instance with environment variables managed through existing `.env` secrets and zero reliance on managed services.
*   **Containerization:** Docker image already in pipeline remains the deployment artifact; ensure Dockerfile includes accessibility assets and new backend dependencies without increasing image size beyond 1GB compressed.
*   **Messaging/Queues:** None; asynchronous behaviors (emails, notifications) must use synchronous dispatch with graceful failure handling and logging since no external queueing system exists.
*   **State Management & Caching:** React Query (or SWR) manages API data caching on the frontend, while backend config values use an in-memory cache with explicit TTL functions; no Redis or external cache is permitted.
*   **Email Provider:** SendGrid (existing API) remains the sole outbound email mechanism; payloads must be templated centrally and send operations wrapped with retries and structured logging.
*   **Secrets & Configuration Management:** Environment variables loaded via `dotenv` provide runtime secrets; variable names must follow `UPPER_SNAKE_CASE` conventions (e.g., `SENDGRID_API_KEY`, `HASH_SALT`, `CI_REGISTRY_TOKEN`), and no secret may be persisted in source control or SQLite.
*   **Configuration Registry:** The `Config` table acts as the persistent feature-flag store; admin UI updates must write through API endpoints to keep auditing consistent.
*   **Runtime Limits:** Node.js memory usage must remain below 512MB; concurrency depends on Express’ non-blocking model, so CPU-intensive work (hashing) must be minimal and implemented with streaming or asynchronous operations when possible.
*   **Security Tooling:** npm audit (critical level) is mandatory in CI; dependencies above severity threshold must block merges until remediated, and GitHub Dependabot alerts must be triaged within 48 hours.
*   **Testing Harness:** Jest for backend, React Testing Library for frontend; coverage must focus on new modules (board controller, vote service, accessibility context) to guarantee stability, and snapshot tests should assert theming changes.
*   **CI/CD Stack:** GitHub Actions workflows (`ci.yml`, `deploy.yml`) orchestrate lint/test/audit steps, Docker builds, vulnerability scanning, container launch, `/healthz` curl, and GHCR pushes; no alternative pipeline is allowed.

---

<!-- anchor: 3-0-rulebook -->
### **3.0 The "Rulebook" (Cross-Cutting Concerns)**

*   **Feature Flag Strategy:** Implement config-driven flags persisted in existing `Config` table with cached reads on the backend and mirrored context hooks on the frontend; every net-new UI exposure (board roster visibility, accessibility toggle rollout, poll types) MUST ship disabled by default until validated, and controllers must read the flag before returning data to guests.
*   **Observability (Logging, Metrics, Tracing):** Use structured JSON logs via pino (backend) and console grouping (frontend dev mode); include correlation IDs per request, log hash chain computation events, and expose a lightweight `/healthz` and `/metrics` (Prometheus text) endpoint so deployment workflows can run curl checks before publishing images.
*   **Security:** Enforce role-based guards at the router layer; board history endpoint is `members-only` regardless of visibility flag, contact forms must rate-limit by IP + reCAPTCHA-lite token, SendGrid API keys must be read from environment variables only, and vote receipts must never expose user identifiers.
*   **Data Protection:** Every table storing PII requires migration-level defaults (e.g., `NOT NULL` on user references), hashed tokens for receipts, and encryption-in-transit via existing HTTPS termination; backups should remain simple filesystem snapshots taken post-deploy.
*   **Performance & Resilience:** Cache configuration reads in memory with 60s TTL, wrap email sends in retries with exponential backoff, and ensure hash-chain inserts run inside SQLite transactions with immediate locking mode to avoid corruption on low resources.
*   **Accessibility & UX Consistency:** When high-visibility mode is active, all components must read context values for typography scaling, ensure icons receive `aria-label`s, provide fallback instructional text for screen-readers, and align with WCAG AA guidance even when feature flags disable certain content.
*   **Compliance & Privacy:** Emails triggered by poll notifications must include unsubscribe or contact instructions referencing HOA bylaws; logs must redact personal emails and limit retention to 90 days unless required for governance disputes.
*   **Change Management:** Any schema change or new endpoint requires an accompanying migration, OpenAPI update, and release note entry; feature flag keys must follow `domain.feature-name` naming to avoid collisions across modules.

---

<!-- anchor: 4-0-blueprint -->
### **4.0 The "Blueprint" (Core Components & Boundaries)**

*   **System Overview:** The HOA Management System remains a layered monolith in which the React SPA consumes REST endpoints from Express controllers backed by SQLite, augmented with SendGrid email delivery and CI/CD automation; each new capability is encapsulated within its module yet deploys within the same container for predictable operations on a constrained Linode host.
*   **Core Architectural Principle:** Separation of Concerns is enforced through clearly defined frontend pages/components, backend controllers, services, and data models; no module may directly access another module's persistence tables or React state without going through its public interface or shared context.

*   **Key Components/Services:**
    *   **CommunityWebApp:** Presents resident-facing pages (Board, Polls, Vendors) and honors accessibility toggles plus feature flags fetched at boot.
    *   **AdminConsole:** Provides privileged workflows (board roster edits, poll creation, vendor CRUD) guarded by auth roles and surfacing contextual help for complex tasks.
    *   **ApiGateway (Express Server):** Central HTTP interface that validates auth, enforces rate limits, loads config flags, and dispatches requests to domain services.
    *   **BoardGovernanceService:** Handles board title/member CRUD, visibility logic, roster history queries, and contact form orchestration including SendGrid dispatch.
    *   **AccessibilityContextService:** Manages frontend context, localStorage persistence, and theme selection via `createAppTheme`, ensuring shared styling tokens.
    *   **ThemeEngine:** Encapsulates Material UI theme factory, font scaling, button padding tweaks, and icon styling required for High Visibility mode.
    *   **DemocracyService:** Provides poll lifecycle management, vote recording, hash chain creation, and receipt generation while handling optional notification triggers.
    *   **VoteIntegrityEngine:** Executes the SHA256 hash chaining, maintains sequential integrity, and exposes verification utilities for receipts.
    *   **EmailNotificationService:** Abstracts SendGrid payload construction for board contact, poll notifications, and future templated emails with consistent metadata.
    *   **VendorDirectoryService:** Manages vendor CRUD, filtering, and caching to present residents with curated local providers without data duplication.
    *   **ConfigRegistry:** Uses `Config` table as lightweight key-value store powering feature flags, visibility toggles, email throttles, and High Visibility defaults, with admin edit forms.
    *   **FeatureFlagAdminUI:** Dedicated admin panel widget to view, toggle, and annotate flags with descriptions and rollout notes.
    *   **ResidentNotificationLog:** Stores outbound communication summaries (subject, recipients, timestamp) for accountability and future audits.
    *   **AuditLogStore:** SQLite tables capturing immutable records (vote hashes, admin actions) to support traceability and resident trust.
    *   **CI-CD Pipeline:** GitHub Actions workflows for CI and deployment, now containing npm audit enforcement, Docker build, runtime health checks, and GHCR push gating.
    *   **HealthMonitor:** Simple monitoring script invoked during deployment and optionally via cron to ping `/healthz` and alert maintainers via email when anomalies occur.

*   **Inter-Component Contracts:**
    *   CommunityWebApp interacts with ApiGateway exclusively through typed API clients; no direct DB access or SendGrid calls may occur in the frontend.
    *   AdminConsole components must consume the same API contracts as end-user flows, ensuring parity and preventing hidden logic.
    *   Domain services (BoardGovernanceService, DemocracyService, VendorDirectoryService) interact with SQLite via models and share helper utilities only through explicit modules to prevent circular dependencies.
    *   VoteIntegrityEngine exposes a single `appendVote` method that accepts validated DTOs and returns the computed hash; only DemocracyService may call it.
    *   EmailNotificationService exposes `sendBoardContactEmail` and `sendPollNotificationEmail` signatures that accept typed DTOs; calling services must validate payloads and pass sanitized content only.
    *   ConfigRegistry publishes read-through helpers returning strongly typed config values; consumers must handle undefined states via defaults, never mutate config outside dedicated admin flows.
    *   ThemeEngine consumes AccessibilityContext values and emits Material UI theme objects; all layout components must use this API instead of local overrides to avoid divergence.
    *   ResidentNotificationLog receives callbacks from EmailNotificationService after delivery attempts, ensuring a single history of outbound messages.
    *   CI-CD Pipeline consumes the `/healthz` endpoint post-build and may roll back automatically if curl fails, ensuring runtime stability prior to release.
    *   HealthMonitor reads the same endpoints and notifies administrators; it must never mutate application data.

---

<!-- anchor: 5-0-contract -->
### **5.0 The "Contract" (API & Data Definitions)**

*   **Primary API Style:** RESTful endpoints documented through OpenAPI (YAML) stored alongside controllers; all endpoints must return JSON with explicit success/error schemas and include feature-flag metadata where relevant.

*   **Data Model - Core Entities:**
    *   **User:** `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`, optional `phone`.
    *   **BoardTitle:** `id`, `title`, `rank`, `description`.
    *   **BoardMember:** `id`, `user_id`, `title_id`, `start_date`, `end_date`, `bio`, `created_at`.
    *   **BoardVisibilityConfig:** `key` (`board_visibility`), `value`, `updated_by`, `updated_at`.
    *   **ContactRequest:** `id`, `requestor_email`, `subject`, `message`, `captcha_token`, `status`, `submitted_at`.
    *   **Poll:** `id`, `title`, `description`, `type`, `is_anonymous`, `notify_members`, `start_at`, `end_at`, `created_by`.
    *   **PollOption:** `id`, `poll_id`, `text`, `order_index`.
    *   **Vote:** `id`, `poll_id`, `user_id` (nullable), `option_id`, `timestamp`, `prev_hash`, `vote_hash`, `receipt_code`.
    *   **Vendor:** `id`, `name`, `service_category`, `contact_info`, `rating`, `notes`, `created_by`.
    *   **AccessibilityPreference:** `id`, `user_id` (nullable for guests), `is_high_visibility`, `last_updated`, `source` (localStorage or profile).
    *   **EmailAudit:** `id`, `template`, `recipient_count`, `request_payload_hash`, `sent_at`, `status`.
    *   **ConfigFlag:** `id`, `key`, `value`, `description`, `scope`, `updated_at`.
    *   **FeatureFlagAudit:** `id`, `flag_key`, `old_value`, `new_value`, `changed_by`, `changed_at`, `note`.
    *   **ThemePreset:** `id`, `mode`, `primary_color`, `background_color`, `font_scale`, `button_padding`.
    *   **AuditEvent:** `id`, `entity`, `entity_id`, `action`, `actor_id`, `metadata_json`, `timestamp`.

*   **API Endpoint Contracts:**
    *   **GET /board:** Returns current board roster respecting `board_visibility`; includes flag metadata `{"visible_to":"public|members","generated_at":ISO}`.
    *   **GET /board/history:** Auth-only endpoint returning paginated history records; response includes `title`, `member_name`, `start_date`, `end_date`, `bio`.
    *   **POST /board/contact:** Accepts `subject`, `message`, `email`, optional `attachment_id`; validates CAPTCHA token, queues SendGrid payload, records `ContactRequest`, and returns `{"status":"accepted","timestamp":ISO}`.
    *   **POST /admin/board/members:** Admin-only; payload includes `user_id`, `title_id`, `start_date`, optional `end_date`, `bio`; responds with created record plus feature flag snapshot to sync caches.
    *   **PUT /admin/board/members/{id}:** Allows editing assignments; ensures history versioning by auto-closing previous records when titles change.
    *   **GET /polls:** Returns active and scheduled polls; query params allow filtering by `type` and `status`.
    *   **POST /polls:** Admin endpoint for poll creation; accepts `notify_members` boolean, returns poll plus asynchronous email dispatch result metadata.
    *   **POST /polls/{id}/votes:** Validates user eligibility, locks table, calculates hash via SHA256 per formula, stores vote, and returns `{"receipt":hash,"submitted_at":ISO}`.
    *   **GET /polls/{id}/receipts/{hash}:** Public verification endpoint returning truncated vote metadata without user identifiers; errors use `404` when hash unknown.
    *   **GET /vendors:** Provides vendor list with sorting/filtering; includes caching headers to minimize reloads.
    *   **POST /vendors:** Admin-only; payload includes vendor details plus optional `tags` array; responds with persisted record and audit event ID.
    *   **GET /config/flags:** Returns key-value pairs for feature flags, used by frontend to initialize contexts alongside TTL metadata.
    *   **PATCH /config/flags/{key}:** Admin-only endpoint to toggle flags with justification string captured in `FeatureFlagAudit`.
    *   **GET /accessibility/theme:** Returns computed theme tokens for standard and high-visibility modes so frontend can pre-render SSR-critical CSS.
    *   **GET /healthz:** Lightweight readiness probe returning version, db connectivity flag, and feature flag cache status.

---

<!-- anchor: 6-0-safety-net -->
### **6.0 The "Safety Net" (Ambiguities & Assumptions)**

*   **Identified Ambiguities:**
    *   The spec does not state how resident authentication is currently handled or whether SSO/2FA requirements exist.
    *   Email throttling expectations for board contact and poll notifications are unspecified.
    *   Vendor rating/review moderation rules and visibility levels are unclear.
    *   Accessibility Suite persistence rules for unauthenticated visitors are not described.
    *   Hash chain retention and archival strategy are undefined for long-term governance proof.
    *   Governance requirements for deleting or editing votes are not described, especially for correction of mistakes.
    *   Requirements for multilingual accessibility cues or localization are absent.
    *   The expected cadence for CI health checks or alerting channels is unspecified.

*   **Governing Assumptions:**
    *   Authentication continues using the existing session/JWT mechanism; no new identity provider will be introduced, but endpoints must enforce role scopes as documented.
    *   Email sends will use the existing SendGrid account with daily rate well below provider limits; implement in-app throttling (per-IP, per-user) rather than employing an external queue, and surface rejection messages to admins.
    *   Vendor ratings are stored internally and visible to authenticated members only; admins moderate submissions manually before publication, and public guests see only vendor names plus categories.
    *   Accessibility preferences are stored in localStorage for guests and linked to user profiles when authenticated, defaulting to standard mode for first-time visitors regardless of device.
    *   Vote hash records are retained indefinitely within SQLite; periodic exports may be performed manually, so schema must support chronological queries without purging data, and deletion is forbidden unless legally mandated.
    *   If a vote must be corrected, the system records a compensating vote entry referencing the previous hash rather than mutating history; UI will guide admins through this remediation flow.
    *   Localization is limited to English; accessibility cues rely on plain-language tooltips rather than translated content, ensuring focus remains on contrast and clarity.
    *   CI health checks run within GitHub Actions only; alerts surface via GitHub notifications/email, and no external monitoring stack is introduced beyond the optional HealthMonitor script.
