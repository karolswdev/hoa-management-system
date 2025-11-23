<!-- anchor: 3-0-proposed-architecture-behavioral-view -->
## 3. Proposed Architecture (Behavioral View)

*   **3.7. API Design & Communication:**
    *   **API Style:** RESTful JSON endpoints remain the universal contract because the foundation bans alternative RPC layers and React Query expects declarative HTTP resources.
        The ApiGateway mediates every call, translating HTTP verbs into service method invocations while enforcing consistent pagination and filter query parameters.
        All controllers emit structured payloads with `{ data, meta, flags }` envelopes so clients can simultaneously render content and evaluate feature flag hints.
        Error handling follows RFC 9457 style JSON problem objects, ensuring AdminConsole modals can surface machine-readable codes like `BOARD_VISIBILITY_FORBIDDEN`.
        Rate limiting metadata is expressed through `Retry-After` headers, allowing the CommunityWebApp to gracefully back off when contact forms are throttled.
        Authentication relies on the existing JWT cookie, and endpoints indicate auth state via `401` plus a `WWW-Authenticate` header referencing the HOA session realm.
        Idempotent POST semantics are supported for vote casting by accepting an optional `clientRequestId` header that the ApiGateway stores in the AuditLogStore.
        Every response includes an `X-Feature-Flags` header listing the ConfigRegistry cache timestamp so the frontend can refresh stale toggles.
        The REST style also enables the AccessibilityContextService to fetch `GET /config/flags` during hydration without juggling WebSocket subscriptions.
        Admin endpoints under `/admin` namespace include explicit documentation of required roles in the OpenAPI schema to avoid unintentional exposure.
        Filtering accepts comma-separated query parameters, yet the ApiGateway normalizes them into arrays before calling services to limit parsing duplication.
        Caching headers follow a conservative `Cache-Control: private, max-age=60` policy, matching the ConfigRegistry TTL expectation set in the rulebook.
        Content negotiation is fixed to `application/json; charset=utf-8`, preventing any user agent from demanding XML or other unsupported encodings.
        Validation errors surface as `422` responses with `fields` arrays, a structure consumed uniformly by CommunityWebApp forms and AdminConsole tables.
        Hypermedia links are intentionally sparse; only pagination responses expose `next` and `prev` URLs to keep payloads light for slower resident devices.
        Sequencing of writes leverages HTTP status codes such as `202` when SendGrid dispatch requires background retries, even though no queue exists.
        Board contact submissions respond with an accepted timestamp and correlation ID, enabling residents to reference the ID when following up.
        Poll creation responses echo the computed schedule and server time, helping AdminConsole adjust for any device clock skew.
        Accessibility toggles use REST endpoints to save user preferences by POSTing to `/accessibility/preferences`, ensuring the same style across modules.
        Delete operations primarily soft-delete by setting `end_date` fields, so the API returns `200` with the updated record rather than `204`.
        Feature flag updates require a `PATCH` with `value` and `note`, and the ApiGateway logs both the body hash and actor ID to the FeatureFlagAudit.
        Board roster requests respect the `board_visibility` config by returning `403` plus metadata describing which flag blocked the response when guests are restricted.
        Poll receipt lookups (`GET /polls/{id}/receipts/{hash}`) always respond in constant time to avoid revealing participation frequency.
        Vendor directory GET endpoints support `If-None-Match` headers, and ApiGateway computes ETags as SHA256 digests of payload JSON.
        RESTful uniformity also simplifies CI health checks because the deployment workflow can curl `/healthz` and expect a predictable JSON body.
        EmailNotificationService exposures happen through service calls, not HTTP, yet the API style describes how controllers represent the eventual email state.
        Pagination defaults to 20 records per page, with `?page` and `?pageSize` query parameters capped by ApiGateway to prevent SQLite exhaustion.
        Config flag responses include `expiresAt`, instructing clients when to revalidate without additional fetch storms.
        The REST style enforces stateless controllers; even the hash chain operations rely entirely on payload content plus SQLite transactions.
        DTOs for board history include nested `title` objects rather than flattening fields, aligning with React component expectations.
        The same REST grammar applies to health monitoring endpoints, so the HealthMonitor script reuses the CommunityWebApp HTTP client library.
        PUT versus PATCH semantics are explicit: the roadmap only uses PATCH for targeted flag changes and PUT for complete entity replacements.
        Standardized path parameters always use numeric IDs except for receipt hashes, which remain base64url strings for readability.
        OpenAPI-driven documentation ensures residents with admin access can self-serve API tokens when automating micro reports.
        REST style encourages consistent instrumentation; pino logs embed the HTTP method and path, unlocking aggregated dashboards later.
        Request bodies never include server-generated IDs; the ApiGateway rejects attempts to override auto-increment fields to maintain data integrity.
        Controllers sanitize whitespace and HTML tags before handing objects to services, yet the REST interface still accepts Markdown fields where specified.
        Multi-step flows, such as creating a poll and options, use nested endpoints `/polls/{pollId}/options` to keep mental mapping straightforward.
        Input compression is disabled to avoid zip-bomb risks on the small server, so REST payload sizes remain small and textual.
        All endpoints document rate limits via `X-RateLimit-*` headers, enabling the Accessibility toggle to space out repeated config fetches.
        The board contact REST call enforces CAPTCHA tokens in the JSON body, and the ApiGateway ensures tokens propagate to verification services.
        The REST style forms the backbone for feature-flagged rollouts: new endpoints can safely return `404` to unauthorized users until toggles flip.
        Nested resources include full relative links so React Query caches them under unique keys despite similar lists.
        Because the infrastructure forbids websockets, REST long-polling handles the minimal need for poll receipt verification refreshes.
        Response serialization always orders object keys to aid deterministic hashing when verifying chain receipts.
        ApiGateway injects correlation IDs in the `X-Request-ID` header, and REST clients include the same ID when performing retries.
        MIME attachments on board contact rely on multi-part form data, but the ApiGateway immediately streams attachments to storage before returning JSON.
        Admin bulk uploads for vendor data use REST streaming uploads with chunked transfer encoding due to their occasional larger payloads.
        Strict REST semantics keep SendGrid integration behind the EmailNotificationService, so no endpoint ever exposes provider-specific schemas.
        Uniform resource naming also allows the ConfigRegistry to precompute permissions, since each route maps to a known domain scope.
        RESTful design means the DemocracyService hash chain is invoked via a POST while returning the computed receipt in the JSON response body.
        Response bodies embed `links.self` fields, letting offline-ready clients rehydrate cached data without inventing inference rules.
        Structured REST metadata includes `trace.sampled` booleans for future distributed tracing integration even without a full solution today.
        The restful approach uses consistent snake_case field names that align with SQLite column names, minimizing mapping confusion.
        ApiGateway translates HTTP caching headers into ConfigRegistry TTL logging, ensuring emission of warnings when clients ignore `max-age` hints.
        The restful paradigm extends to `/metrics`, which returns Prometheus text but is wrapped inside a GET call documented alongside JSON endpoints.
    *   **Communication Patterns:** Component collaborations stay synchronous request/response for user-facing flows, while internal service hops remain in-process calls per the layered monolith mandate.
        Residents interact via CommunityWebApp, which issues HTTPS requests to ApiGateway using React Query hooks and automatically retries idempotent reads.
        Guest views of the board roster call `/board`, and ApiGateway consults ConfigRegistry cache before hitting BoardGovernanceService.
        When ConfigRegistry cache is stale, ApiGateway pulls from SQLite, refreshes the TTL, and stores the snapshot for subsequent responses.
        AdminConsole communicates through the same ApiGateway routes but attaches elevated JWT scopes, ensuring a single enforcement point for RBAC.
        BoardGovernanceService orchestrates BoardTitles and BoardMembers models, assembling DTOs and forwarding sanitized data to ApiGateway.
        Contact form submissions pass from CommunityWebApp to ApiGateway, which validates CAPTCHA tokens via existing verification helper before touching services.
        Validated contact payloads move to BoardGovernanceService, which queries active board members, fetches their emails, then calls EmailNotificationService.
        EmailNotificationService invokes SendGrid synchronously and immediately records success or failure in ResidentNotificationLog via a SQLite insert.
        After email dispatch, BoardGovernanceService stores the original contact request metadata into AuditLogStore for future reference.
        Accessibility toggle interactions remain purely front-end, but the context optionally persists preferences by calling ApiGateway so profiles stay synced.
        During poll creation, AdminConsole sends JSON to `/polls`, ApiGateway verifies admin role, then forwards to DemocracyService.
        DemocracyService uses transactional writes to insert Polls and PollOptions rows sequentially to maintain referential integrity.
        If notify_members is true, DemocracyService triggers EmailNotificationService with a templated payload describing the poll context.
        EmailNotificationService loops through members, batching recipients to respect SendGrid rate suggestions, and logs aggregated metrics.
        Vote casting begins with CommunityWebApp retrieving poll details; ApiGateway caches active polls for 30 seconds to reduce DB load.
        When a user submits a vote, ApiGateway locks the Votes table by beginning a serialized transaction before calling VoteIntegrityEngine.
        VoteIntegrityEngine fetches the last vote hash, calculates the new `vote_hash`, adds the `prev_hash`, and hands the enriched payload back.
        DemocracyService writes the vote row, commits the transaction, and returns the receipt to ApiGateway.
        ApiGateway responds with the receipt to CommunityWebApp, which surfaces the hash and stores it locally for verification.
        Receipt verification flows start from CommunityWebApp hitting `/polls/{id}/receipts/{hash}`, ApiGateway queries VoteIntegrityEngine for validation, and returns truncated metadata.
        Vendor directory retrieval uses synchronous GET requests; ApiGateway may include `Last-Modified` headers so clients leverage conditional requests.
        Vendor CRUD operations go through AdminConsole to ApiGateway, down into VendorDirectoryService, which enforces moderation status before persisting.
        AccessibilityContextService fetches `/config/flags` on boot, caches values, and shares them with Navbar toggles via React context.
        When High Visibility mode toggles, the front end simply updates context while ThemeEngine recomputes the Material UI theme locally.
        ApiGateway contains middleware that attaches correlation IDs, which both CommunityWebApp and AdminConsole log for tracing within browser consoles.
        HealthMonitor interacts via GET `/healthz`, and ApiGateway responds after verifying SQLite connectivity and ConfigRegistry freshness.
        During deployment, GitHub Actions run `curl` commands against `/healthz` within the container, mirroring HealthMonitor's synchronous pattern.
        For board history, ApiGateway enforces authentication before calling BoardGovernanceService, which paginates results and never exposes them publicly.
        Config flag updates originate from AdminConsole, invoking PATCH requests that ApiGateway routes to ConfigRegistry with RBAC enforcement.
        ConfigRegistry writes the new flag value to SQLite, updates the in-memory cache, and emits structured logs about the change.
        FeatureFlagAdminUI, embedded within AdminConsole, subscribes to React Query invalidation events that fire after successful PATCH responses.
        Observability uses synchronous logging; ApiGateway logs every service call boundaries, and pino transports forward JSON to stdout.
        Poll status transitions rely on cron-like checks; ApiGateway exposes `/polls` and the frontend polls the endpoint to detect state changes.
        When a poll closes, DemocracyService updates `end_at` and caches the final tallies so repeated reads do not recompute aggregates.
        VoteIntegrityEngine exposes an internal `appendVote` function; no other service can directly manipulate the hash chain to guarantee integrity.
        ResidentNotificationLog receives callbacks from EmailNotificationService only after SendGrid acknowledges receipt, ensuring accurate counts.
        Admin audit actions pass from controllers to AuditLogStore, creating a durable record without invoking any asynchronous queue.
        Accessibility contextual help icons read context state synchronously; they do not fetch additional data, keeping the UI lightweight.
        Board visibility toggles propagate through ConfigRegistry; ApiGateway's middleware reads the latest value before processing `/board` responses.
        When board visibility is set to members_only, ApiGateway short-circuits guest requests and logs the decision to deter probing.
        Board roster updates involve AdminConsole sending POST or PUT requests, which BoardGovernanceService handles by closing previous assignments.
        SQLite triggers (if defined) support audit columns, yet the service layer still sets `updated_at` fields before writes.
        Poll notification emails include unsubscribe instructions per compliance, and EmailNotificationService uses templated merge fields.
        When SendGrid fails, EmailNotificationService retries twice with exponential delays handled via synchronous waits before returning to DemocracyService.
        ApiGateway monitors for repeated failures and propagates warnings in response metadata so AdminConsole can notify operators.
        Configurable rate limits for board contact rely on IP address hashed and stored with TTL entries in SQLite, checked synchronously per submission.
        AdminConsole receives immediate feedback on rate limit hits, enabling moderators to advise residents through alternate channels.
        Vote receipt verification does not email residents; the flow remains purely HTTP to ensure privacy.
        Accessibility preferences for authenticated users send POST requests whose responses include the saved timestamp, letting UI confirm persistence.
        CommunityWebApp uses `fetch` with credentials included, guaranteeing that ApiGateway can read session cookies for RBAC.
        ApiGateway attaches `Cache-Control: no-store` to sensitive endpoints like `/board/history`, preventing browsers from storing private data.
        Vendor listing responses include server-rendered sort metadata, enabling clients to present consistent ordering between requests.
        FormHelper components request contextual text from static JSON, not APIs, to minimize latency when toggling accessibility features.
        Sequence-critical flows such as vote casting rely on SQLite `BEGIN IMMEDIATE` transactions to prevent concurrent writes from corrupting the hash chain.
        ApiGateway gracefully handles SQLite busy errors by retrying the transaction with jitter before returning a failure.
        DemocracyService timestamps votes using server-side clocks to avoid tampering from clients.
        Each successful vote insertion triggers an AuditLogStore entry capturing poll ID, user ID (if allowed), and receipt hash.
        ApiGateway emits structured logs for each stage: request received, service invoked, response sent, enabling chronological tracing.
        AdminConsole uses Web Workers to hash attachments before upload when contact forms support files, reducing server computation.
        Attachment metadata flows from BoardGovernanceService into EmailNotificationService, which attaches files to SendGrid payloads with sanitized names.
        VendorDirectoryService caches frequently requested categories in memory to reduce repeated SQLite scans.
        AccessibilityContextService listens for `storage` events so multiple tabs stay in sync, even though the server remains stateless.
        When AdminConsole toggles a feature flag, ApiGateway immediately invalidates ConfigRegistry cache to propagate the change across requests.
        Poll list responses include `serverTime`, allowing CommunityWebApp to compute countdown timers without extra pings.
        Sequence diagrams are documented per this file to help developers reason about synchronous boundaries.
        Error responses always travel back through ApiGateway, which masks internal stack traces and replaces them with support-friendly messages.
        ConfigRegistry ensures only a single write can update a flag at once by locking the row within a transaction.
        FeatureFlagAdminUI acknowledges success after ApiGateway returns the new flag value, aligning front-end state.
        Board contact throttling persists counts in SQLite; ApiGateway increments counters within a transaction to prevent double submissions.
        AdminConsole uses React Query invalidation to re-fetch roster lists right after updates, keeping UI consistent.
        Ci/CD health checks use synchronous HTTP; no SSH or custom protocols are needed, simplifying deployment automation.
        VoteIntegrityEngine provides a verification helper that ApiGateway reuses for receipt lookups, ensuring a single implementation.
        ResidentNotificationLog persists aggregated stats for each email dispatch, enabling quick administrative reviews.
        DemocracyService exposes fetch methods for poll results that include aggregated counts plus audit anchors.
        ApiGateway ensures compression like gzip is enabled on responses to minimize bandwidth despite synchronous nature.
        When polls are binding, DemocracyService tags responses with `type: binding`, and ApiGateway adds headers instructing clients to display audit notices.
        Accessibility toggles do not require server confirmation, but persisted states include `source` fields to differentiate localStorage writes from profile saves.
        AdminConsole's board management tables fetch per-title membership lists via dedicated endpoints, reducing payload size.
        EmailNotificationService acts synchronously but returns metadata so calling services understand whether SendGrid accepted the request.
        All communications revolve around direct HTTP and in-process service calls, honoring the constraint to avoid message queues or event buses.
    *   **Key Interaction Flow (Sequence Diagram):**
        *   **Description:** This flow illustrates a resident casting a binding vote, capturing how CommunityWebApp coordinates with ApiGateway, DemocracyService, VoteIntegrityEngine, ConfigRegistry, EmailNotificationService, AuditLogStore, and ResidentNotificationLog.
            The resident toggles High Visibility, yet the vote interaction remains synchronous and respects the accessibility context.
            CommunityWebApp first retrieves live poll metadata to display permitted options and the binding notice.
            ApiGateway validates the session token, fetches feature flags from ConfigRegistry, and only then allows vote submission.
            DemocracyService orchestrates poll eligibility checks, option lookups, and ensures the poll is open.
            VoteIntegrityEngine serializes the hash chain with SHA256 formula, enforcing tamper resistance.
            Upon success, EmailNotificationService optionally delivers acknowledgement if the poll rules demand receipts via email.
            AuditLogStore records every stage, enabling traceability for governance audits.
            ResidentNotificationLog captures the outbound notification summary to align with compliance requirements.
            The diagram emphasizes request-response boundaries and the absence of asynchronous queues.
            HealthMonitor is absent from the flow because it operates out-of-band, underscoring the focus on direct vote submission.
        *   **Diagram (PlantUML):**
            ~~~plantuml
            @startuml
            title Binding Vote Submission with Hash Chain Receipt
            actor Resident as Resident
            participant CommunityWebApp as CommunityWebApp
            participant ThemeEngine as ThemeEngine
            participant ApiGateway as ApiGateway
            participant ConfigRegistry as ConfigRegistry
            participant DemocracyService as DemocracyService
            participant VoteIntegrityEngine as VoteIntegrityEngine
            participant EmailNotificationService as EmailNotificationService
            participant AuditLogStore as AuditLogStore
            participant ResidentNotificationLog as ResidentNotificationLog
            ' Phase: UI Preparation
            Resident -> CommunityWebApp: Toggle High Visibility
            CommunityWebApp -> ThemeEngine: createAppTheme("high-vis")
            ThemeEngine --> CommunityWebApp: theme tokens + typography scale
            note right of CommunityWebApp: AccessibilityContextService stores \\nin localStorage and updates global state
            alt High visibility already cached
                CommunityWebApp -> ThemeEngine: reuse cached tokens
                ThemeEngine --> CommunityWebApp: confirm cache hit
            else Mode change required
                ThemeEngine -> ThemeEngine: Recompute palette + typography scale
                ThemeEngine --> CommunityWebApp: deliver fresh palette config
            end
            CommunityWebApp -> CommunityWebApp: React Query invalidates poll cache
            CommunityWebApp -> CommunityWebApp: Emphasize buttons per ThemeEngine guidance
            ' Phase: Poll Discovery
            Resident -> CommunityWebApp: Request Active Poll List
            loop Poll refresh cadence
                CommunityWebApp -> ApiGateway: GET /polls (with credentials)
                ApiGateway -> ConfigRegistry: Read feature flag cache timestamp
                ConfigRegistry --> ApiGateway: Flag snapshot + expiresAt
                alt Flag cache expired
                    ApiGateway -> ConfigRegistry: Refresh board-democracy flags via SQLite
                    ConfigRegistry --> ApiGateway: Fresh values with renewed ttl
                else Cache valid
                    ApiGateway -> ApiGateway: Continue using in-memory snapshot
                end
                ApiGateway -> DemocracyService: fetchActivePolls()
                DemocracyService -> DemocracyService: Load polls + options + status
                DemocracyService -> AuditLogStore: logPollRead(traceId)
                AuditLogStore --> DemocracyService: ack
                DemocracyService --> ApiGateway: Poll list DTO
                ApiGateway --> CommunityWebApp: JSON response + X-Feature-Flags
                CommunityWebApp -> ThemeEngine: request contrast tokens for binding labels
                ThemeEngine --> CommunityWebApp: label styles
                break Resident satisfied
            end
            CommunityWebApp -> CommunityWebApp: Render poll cards and highlight binding polls
            note over Resident,CommunityWebApp: Resident reviews context-sensitive helper icons
            ' Phase: Vote Intent
            Resident -> CommunityWebApp: Select Binding Poll
            CommunityWebApp -> ApiGateway: GET /polls/{id}
            ApiGateway -> DemocracyService: getPollDetail(id)
            DemocracyService -> DemocracyService: Confirm scheduling window
            DemocracyService --> ApiGateway: Poll detail + serverTime
            ApiGateway --> CommunityWebApp: JSON detail + policy metadata
            note right of CommunityWebApp: UI surfaces audit notice and receipt guidance
            Resident -> CommunityWebApp: Choose option + confirm
            opt Client validation fails
                CommunityWebApp -> Resident: Display error and prevent submission
            else Client validation passes
                CommunityWebApp -> ApiGateway: POST /polls/{id}/votes payload
                ApiGateway -> ApiGateway: Validate JWT + role (member)
                ApiGateway -> ConfigRegistry: Ensure democracy feature flag enabled
                ConfigRegistry --> ApiGateway: Flag ok + expiry
                ApiGateway -> DemocracyService: castVote(dto)
                DemocracyService -> DemocracyService: Verify poll open + user eligibility
                alt Poll closed
                    DemocracyService --> ApiGateway: Error (poll_closed)
                    ApiGateway -> AuditLogStore: logVoteRejection(reason=poll_closed)
                    AuditLogStore --> ApiGateway: ack
                    ApiGateway --> CommunityWebApp: 409 Conflict + guidance
                    CommunityWebApp -> Resident: Display closure notice
                else Poll open
                    DemocracyService -> DemocracyService: Begin SQLite transaction (IMMEDIATE)
                    DemocracyService -> VoteIntegrityEngine: appendVoteCandidate(dto)
                    VoteIntegrityEngine -> VoteIntegrityEngine: Fetch prev_hash within transaction
                    VoteIntegrityEngine -> VoteIntegrityEngine: Compute vote_hash = SHA256(user_id+option_id+timestamp+prev_hash)
                    VoteIntegrityEngine -> VoteIntegrityEngine: Derive receipt_code from vote_hash
                    VoteIntegrityEngine --> DemocracyService: vote_hash + prev_hash + receipt_code
                    DemocracyService -> DemocracyService: Persist vote row under serialized transaction
                    DemocracyService -> DemocracyService: Commit transaction ensuring hash chain order
                    DemocracyService -> AuditLogStore: logVoteEvent(pollId, userId, receipt)
                    AuditLogStore --> DemocracyService: ack
                    alt Rate limit triggered
                        ApiGateway --> CommunityWebApp: 429 Too Many Requests + retryAfter
                        CommunityWebApp -> Resident: Inform about cooldown
                        DemocracyService -> AuditLogStore: logRateLimitHit(userId)
                        AuditLogStore --> DemocracyService: ack
                    else Rate limit clear
                        opt Receipt email requested
                            DemocracyService -> EmailNotificationService: sendReceiptEmail(dto, receipt)
                            EmailNotificationService -> EmailNotificationService: Build SendGrid payload
                            EmailNotificationService -> EmailNotificationService: Retry up to 2x on transient failure
                            EmailNotificationService -> ResidentNotificationLog: recordDispatch("vote_receipt", recipients, status)
                            ResidentNotificationLog --> EmailNotificationService: ack
                            EmailNotificationService --> DemocracyService: delivery result + correlationId
                        end
                        DemocracyService --> ApiGateway: VoteSuccess + receipt hash
                        ApiGateway -> AuditLogStore: logHttpResponse(traceId, status=201)
                        AuditLogStore --> ApiGateway: ack
                        ApiGateway --> CommunityWebApp: 201 Created + receipt payload
                        CommunityWebApp -> CommunityWebApp: Store receipt locally + prompt copy action
                        CommunityWebApp -> ThemeEngine: emphasize receipt display per accessibility mode
                        ThemeEngine --> CommunityWebApp: confirm contrast for hash text
                        note over Resident,CommunityWebApp: Resident views hash and optionally saves it offline
                    end
                end
            end
            ' Phase: Verification Request
            Resident -> CommunityWebApp: Verify Receipt
            CommunityWebApp -> ApiGateway: GET /polls/{id}/receipts/{hash}
            ApiGateway -> VoteIntegrityEngine: verifyReceipt(pollId, hash)
            VoteIntegrityEngine -> VoteIntegrityEngine: Lookup hash chain entry
            alt Hash found
                VoteIntegrityEngine --> ApiGateway: receipt summary + timestamp
                ApiGateway -> AuditLogStore: logVerification(pollId, hash, success)
                AuditLogStore --> ApiGateway: ack
                ApiGateway --> CommunityWebApp: 200 OK + truncated metadata
                CommunityWebApp -> Resident: Show verification success
            else Hash missing
                VoteIntegrityEngine --> ApiGateway: Unknown receipt error
                ApiGateway -> AuditLogStore: logVerification(pollId, hash, failure)
                AuditLogStore --> ApiGateway: ack
                ApiGateway --> CommunityWebApp: 404 Not Found + support instructions
                CommunityWebApp -> Resident: Display failure and support contact
            end
            ' Phase: Observability
            ApiGateway -> ConfigRegistry: updateUsageMetrics("democracy")
            ConfigRegistry --> ApiGateway: ack
            ApiGateway -> ApiGateway: Emit pino log with correlationId and timing
            DemocracyService -> AuditLogStore: logPollMetrics(pollId, totals)
            note left of AuditLogStore: Immutable audit trails guarantee governance transparency
            EmailNotificationService -> ResidentNotificationLog: summarizeBatch()
            ResidentNotificationLog --> EmailNotificationService: ack
            loop Optional compliance digest
                EmailNotificationService -> AuditLogStore: snapshotDispatchHistory()
                AuditLogStore --> EmailNotificationService: digest ack
            end
            ' Phase: HealthMonitor context
            note over ApiGateway,DemocracyService: HealthMonitor polls /healthz separately to keep readiness data updated
            @enduml
            ~~~
    *   **Data Transfer Objects (DTOs):** The following payload definitions illustrate the key JSON structures exchanged between CommunityWebApp, AdminConsole, and the ApiGateway so that services remain predictable and auditable.
        `POST /polls` accepts `title`, `description`, `type`, `is_anonymous`, `notify_members`, `start_at`, `end_at`, and an `options` array of `{ text, order_index }` objects.
        Each option object may include an optional `default_selected` boolean for future preference capture, though it defaults to false when omitted.
        Poll creation requests also carry `quorum` metadata when binding votes require minimum participation, enabling DemocracyService validation.
        The response body wraps the created poll inside `data.poll`, includes the server-issued `id`, and echoes sanitized option arrays with generated IDs.
        `meta.emailDispatch` records whether EmailNotificationService accepted the optional notify_members send and surfaces the correlation ID.
        `POST /polls/{id}/votes` carries `option_id`, optional `clientRequestId`, `receiptDelivery` preferences, and the contextual `captcha_token` when required by policy.
        Vote payloads may include `justification` text for binding polls, letting DemocracyService attach rationales to AuditLogStore entries without storing PII in the vote chain.
        The vote response returns `{ receipt, submitted_at, poll_id, integrity: { prev_hash, vote_hash } }` so the UI can display both verification cues and the provenance link.
        `GET /polls` returns `data` as an array of poll summary objects, each holding `id`, `title`, `type`, `status`, `is_anonymous`, `notify_members`, and `schedule` fields for countdown timers.
        Summary objects embed `links.detail` references for React Router prefetching and `flags` arrays explaining whether contextual help should appear.
        `meta.pagination` advertises `page`, `pageSize`, `totalPages`, and `totalRecords`, aligning with the paginated design mandated by the Standard Kit.
        `GET /polls/{id}` responds with a detailed object including `description`, `type`, `accessPolicy`, `is_binding`, `start_at`, `end_at`, and `serverTime` for drift correction.
        Nested `options` entries in the detail payload contain `id`, `text`, `sequence`, and optionally `current_vote_count` when the requester is an admin viewing live tallies.
        A `receiptPolicy` block outlines whether hashes are emailed, displayed only, or both, helping CommunityWebApp conditionally render contact prompts.
        `GET /polls/{id}/receipts/{hash}` replies with `{ hash, poll_id, option_label, timestamp, verification_status }`, keeping user identities out of the DTO per privacy rules.
        `POST /board/contact` accepts `subject`, `message`, `email`, `captcha_token`, `attachment_ids`, and a `consent` boolean, ensuring the board can audit outreach.
        Contact responses follow `{ status:"accepted", timestamp, correlationId, rateLimit }`, where `rateLimit` echoes remaining submissions allowed for the IP hash.
        `GET /board` provides `{ data: { visible_to, generated_at, members: [...] }, meta: { board_visibility_flag } }` so guests know whether data is complete or redacted.
        Each member object includes `user_id`, `name`, `title`, `rank`, `start_date`, `end_date`, and optional `bio`, all sorted server-side using rank then start date.
        `GET /board/history` delivers paginated `history` rows with `title`, `member_name`, `start_date`, `end_date`, and `bio`, plus `meta.access="members_only"` for clarity.
        `POST /admin/board/members` expects `user_id`, `title_id`, `start_date`, optional `end_date`, `bio`, and `visibility_notes`, enabling BoardGovernanceService to maintain chronology.
        The POST response returns the persisted record plus `flags` describing whether the new assignment triggers public visibility depending on the config toggle.
        `GET /config/flags` emits `{ key, value, scope, description, ttl, updated_at }` entries, matching ConfigRegistry expectations for front-end caching.
        `PATCH /config/flags/{key}` receives `{ value, note }` and yields `{ key, old_value, new_value, changed_by, changed_at }` so FeatureFlagAdminUI can annotate revisions.
        `GET /vendors` responds with `vendors` arrays containing `id`, `name`, `service_category`, `contact_info`, `rating`, `notes`, and a `visibility` enum to inform guest vs member exposure.
        `POST /vendors` accepts vendor details plus optional `tags` arrays and `moderation_state`, and responds with the stored record plus `audit_event_id` from AuditLogStore.
        `GET /accessibility/theme` returns `{ mode:"standard", tokens:{ ... }, highVis:{ ... } }`, allowing ThemeEngine to pre-hydrate CSS-in-JS caches.
        `POST /accessibility/preferences` stores `{ is_high_visibility, source, updated_at }` tied to the authenticated user, echoing the persisted entity with `id` references where applicable.
        `GET /healthz` returns `{ status:"ok", version, db:{ connected:true }, flags:{ cacheAgeSeconds }, timestamp }`, which CI and HealthMonitor scripts parse uniformly.
        `POST /board/contact` may also include `resident_address` when admins enable the optional field, stored under ContactRequest for private review only.
        Contact DTOs capture `delivery_preferences` letting admins know whether a resident wants email or phone responses, though phone numbers stay redacted in logs.
        Poll receipt verification errors standardize on `{ error:"not_found", support_email }`, easing translation into accessible UI copy.
        Vendor DTOs expose `rating` as a number plus `rating_source`, clarifying whether the score came from board review, community vote, or imported data.
        DemocracyService returns `auditAnchors` arrays with each poll detail, referencing AuditLogStore IDs to maintain transparency.
        Vote casting DTOs include `contextual_help_acknowledged` booleans ensuring residents confirm they read high-visibility tooltips before binding submissions.
        `GET /polls` optionally includes `filtersApplied` arrays, so the frontend can render chip indicators for active filters without recomputing.
        `POST /polls` may include `documents` arrays referencing attachment IDs stored elsewhere; the response lists accepted documents and any rejected for type limits.
        ResidentNotificationLog entries appear in API responses as `{ template, recipient_count, status, sent_at }` to inform admins when communications triggered.
        Board history DTOs include `amended` flags indicating whether records were corrected via compensating entries rather than edits, aligning with governance assumptions.
        Config flag DTOs expose `scope` values such as `frontend`, `backend`, or `shared`, guiding clients on whether to refresh caches immediately.
        Vendor CRUD DTOs contain `moderator_notes` arrays capturing text plus timestamps to create a clear review trail for AdminConsole moderation.
        Accessibility preference responses include `effective_mode` so guests understand when the server overrode their local selection due to policy.
        `POST /polls/{id}/votes` rejects payloads missing `captcha_token` by returning `422` with `fields:[{ name:"captcha_token", message:"Token required" }]` in the DTO described error format.
        Poll detail DTOs deliver `hashChain` metadata containing `last_hash`, `vote_count`, and `algorithm:"SHA256"`, enabling clients to display integrity badges.
        `POST /admin/board/members` response includes `open_assignments` arrays so AdminConsole can prompt the admin to close overlapping tenures.
        Vendor GET responses expose `cache` metadata describing whether data came from ConfigRegistry TTL caches or fresh DB reads, aligning with observability guidelines.
        Accessibility helper DTOs retrieved from static JSON still follow the `{ id, field, helperText, accessibilityLevel }` structure referenced by FormHelper components.
        `POST /board/contact` acceptance includes `spamScore` values, helping BoardGovernanceService inspect questionable submissions quickly.
        Poll creation responses feature `notifications:{ requested:boolean, dispatched:boolean }` structures, clarifying whether SendGrid accepted the request.
        `GET /polls/{id}` detail furnishes `eligibility:{ roles_allowed, quorum_required }` so CommunityWebApp can short-circuit interactions for unauthorized residents.
        Vote receipt DTOs purposely omit `user_id`, instead containing `anonymity_level` descriptors as mandated in the Contract section.
        `GET /vendors` includes `links.metrics` when AdminConsole needs to fetch aggregated stats for reporting, yet the DTO keeps metrics optional to save bandwidth.
        `PATCH /config/flags/{key}` responses include `featureFlagAuditId`, linking UI confirmations to stored audit events.
        `POST /polls` request supports `notify_members_reason`, persisted for compliance and echoed back in the response `meta` block.
        Contact DTOs embed `board_visibility_snapshot` strings, recording whether the roster was public or private at submission time for legal clarity.
        Vote verification responses carry `chain_position`, enabling residents to understand where their hash sits relative to others without revealing counts.
        Health check DTOs add `services:{ email: "ok" | "degraded" }`, letting CI catch SendGrid outages before deployments continue.
        `GET /polls` summary entries hold `contextual_help_keys`, referencing FormHelper hints when accessibility mode is active.
        Vendor DTOs include `tags` arrays storing categories like `"plumbing"` or `"landscaping"`, matching the VendorDirectoryService schema additions.
        Accessibility preference DTOs include `syncReason` fields so AdminConsole can explain when server policies override guest preferences.
        Poll vote responses embed `links.receiptVerification`, giving clients the exact URL to check the hash later.
        Contact request responses incorporate `links.status`, enabling residents to query `/board/contact/{id}` for updates when admins toggle statuses.
        Vendor creation responses also include `links.self` and `links.audit`, closing the DTO loop for AdminConsole to deep-link into AuditLogStore records.
