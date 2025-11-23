# Specification Review & Recommendations: HOA Management System - Extension Roadmap

**Date:** 2025-11-23
**Status:** ✓ RESOLVED - All architectural decisions provided inline

### **1.0 Executive Summary**

This document is an automated analysis of the provided project specifications. It has identified critical decision points that require explicit definition before architectural design can proceed.

**Required Action:** The user is required to review the assertions below and **update the original specification document** to resolve the ambiguities. This updated document will serve as the canonical source for subsequent development phases.

### **2.0 Synthesized Project Vision**

*Based on the provided data, the core project objective is to engineer a system that:*

Extends an existing HOA Management System to enable transparent democratic governance through secure voting mechanisms, improve accessibility for all residents, and formalize board management structures—all while operating within strict resource constraints (1GB RAM Linode, ~40 homes, SQLite database).

### **3.0 Critical Assertions & Required Clarifications**

---

#### **Assertion 1: Voting Anonymity vs. Auditability Conflict**

*   **Observation:** The specification mandates both `is_anonymous` flag support and a cryptographic hash chain that uses `user_id` as a hash input (`SHA256( user_id + option_id + timestamp + prev_vote_hash )`). These requirements are fundamentally incompatible.
*   **Architectural Impact:** This is a critical security and privacy decision that affects the voting module's core cryptographic architecture, legal compliance posture, and user trust model.
    *   **Path A (Pseudonymous Auditability):** Remove true anonymity. The hash chain includes `user_id`, enabling full vote attribution and audit trails. This satisfies regulatory requirements for binding votes but sacrifices voter privacy.
    *   **Path B (True Anonymity):** Eliminate `user_id` from the hash formula and use a blind signature scheme or zero-knowledge proof system. This preserves voter privacy but requires significantly more complex cryptographic infrastructure and may not satisfy legal requirements for binding corporate votes.
    *   **Path C (Dual-Mode System):** Implement separate cryptographic architectures: informal polls use true anonymity (no `user_id` tracking), while binding votes use pseudonymous auditability with full attribution.
*   **Default Assumption & Required Action:** To maintain system simplicity within the 1GB RAM constraint and satisfy likely HOA legal requirements, the system will be architected assuming **Path A (Pseudonymous Auditability)**. The `is_anonymous` flag will control UI display (hiding voter names from results) but not eliminate backend vote attribution. **The specification must be updated** to explicitly define the anonymity model, legal requirements for vote records retention, and whether true cryptographic anonymity is a hard requirement.

**✓ DECISION: Path A (Pseudonymous Auditability)**

**Answer:**
- The `is_anonymous` flag controls **UI display only** - voter names are hidden from results screens but votes remain attributed in the database with `user_id`
- All votes include `user_id` in the hash chain formula: `SHA256(user_id + option_id + timestamp + prev_vote_hash)`
- Admin audit logs can reconstruct who voted for what if legally required (quorum verification, contested decisions)
- Privacy policy disclosure required: "Votes are recorded with your identity for audit purposes but displayed anonymously to other members"
- **Legal compliance:** Vote records with full attribution retained for 7 years per standard HOA document retention policies
- **Rationale:** HOA binding votes require attribution for legal purposes; 1GB RAM constraint makes zero-knowledge proofs impractical; small community (40 homes) doesn't warrant complex cryptographic anonymity

---

#### **Assertion 2: Hash Chain Integrity vs. SQLite Concurrency Model**

*   **Observation:** The specification requires a tamper-proof hash chain with `prev_hash` linkage but proposes SQLite as the persistence layer. SQLite's default transaction isolation (serializable) and single-writer architecture create race conditions for concurrent vote submissions that could break chain integrity.
*   **Architectural Impact:** This fundamentally affects the voting module's reliability under load and determines whether the current infrastructure can support the feature.
    *   **Tier 1 (Sequential Processing):** Implement a vote queue with single-threaded hash chain processing. Simple and guaranteed correct, but introduces latency (100-500ms per vote) and creates a DoS vulnerability if the queue is flooded.
    *   **Tier 2 (Application-Level Locking):** Use Redis or in-memory mutex to serialize vote writes across multiple Node.js process instances. Requires adding Redis to the infrastructure stack (additional ~50MB RAM overhead).
    *   **Tier 3 (Database Migration):** Migrate to PostgreSQL with row-level locking and advisory locks for the hash chain. Provides the most robust concurrency handling but requires infrastructure changes and ~100-200MB additional RAM.
*   **Default Assumption & Required Action:** Given the 1GB RAM constraint and small user base (~40 homes), the system will be architected assuming **Tier 1 (Sequential Processing)** with a vote submission queue. With 40 homes, concurrent vote collision probability is negligible. **The specification must be updated** to define expected concurrent voting load (e.g., "all 40 residents vote within a 5-minute window") and acceptable vote submission latency.

**✓ DECISION: Tier 1 (Sequential Processing with Vote Queue)**

**Answer:**
- Implement in-memory vote submission queue in `backend/src/services/vote.service.js`
- Process votes sequentially using SQLite transactions to maintain hash chain integrity
- **Expected latency:** 100-300ms per vote (acceptable for this use case)
- Admin dashboard shows pending vote queue depth for monitoring
- **Acceptable load specification:** System designed to handle all 40 residents voting within a 10-minute window without issues
- **Concurrent collision probability:** Negligible with 40 homes; even if all vote in a 5-minute window, sequential processing handles easily
- **Future migration path:** If concurrent load increases, migration to Tier 2 (Redis) is straightforward and doesn't require architectural changes
- **Rationale:** No additional infrastructure (Redis/PostgreSQL) required - maintains simplicity within 1GB RAM constraint

---

#### **Assertion 3: Email Notification Strategy for Poll Creation**

*   **Observation:** The specification states admins can "optionally email all members" when creating a poll, but provides no guidance on email delivery guarantees, rate limiting, or failure handling within SendGrid's infrastructure constraints.
*   **Architectural Impact:** This decision affects system reliability, operational costs, and user experience during critical voting periods.
    *   **Path A (Fire-and-Forget):** Dispatch all emails asynchronously without delivery confirmation. Simple implementation, but admins have no visibility into failed deliveries. Risk: residents miss critical votes due to silent email failures.
    *   **Path B (Confirmed Delivery):** Implement a job queue (e.g., Bull with Redis) that tracks email delivery status via SendGrid webhooks and provides admins with a delivery report. Requires Redis infrastructure and webhook endpoint implementation.
    *   **Path C (Hybrid with Retry):** Asynchronous dispatch with automatic retry (3 attempts over 24 hours) for failed sends, logged to admin dashboard. No delivery guarantee UI, but improves reliability without requiring webhooks.
*   **Default Assumption & Required Action:** To balance simplicity and reliability within existing infrastructure, the system will implement **Path C (Hybrid with Retry)** using SQLite-backed job persistence. **The specification must be updated** to define email delivery SLA expectations, whether admins require real-time delivery confirmation, and acceptable notification delay windows.

**✓ DECISION: Path C (Hybrid with Retry)**

**Answer:**
- Use SQLite-backed job queue table: `EmailQueue` (`id`, `recipient`, `subject`, `body`, `attempts`, `last_attempt`, `status`)
- Background worker retries failed emails: **3 attempts over 24 hours** (immediate, +1 hour, +23 hours)
- Admin dashboard displays email delivery statistics per poll
- All email failures logged to admin notification panel
- **SLA expectations:**
  - 95% of emails delivered within 5 minutes
  - Failed emails surface in admin dashboard within 1 hour
  - No guarantee of delivery for invalid email addresses (admin notified of permanent failures)
- **No real-time delivery confirmation:** Admins see delivery stats after the fact, not during poll creation
- **Acceptable notification delay:** Up to 24 hours for final retry; most delivered immediately
- **Rationale:** Balances reliability with infrastructure simplicity; no webhook endpoints or Redis required; provides admin visibility into failures without real-time overhead

---

#### **Assertion 4: Board History Access Control Scope**

*   **Observation:** The specification mandates that board history "must strictly remain accessible only to authenticated members" while the current board roster visibility can be toggled public/members-only. The authorization boundary for "history" is ambiguous—does this include all historical board composition data, or only sensitive fields like contact information and bios.
*   **Architectural Impact:** This affects the frontend routing architecture, API authorization middleware complexity, and potentially the database schema if partial data exposure is permitted.
    *   **Path A (Complete Lockdown):** All historical board data (names, titles, dates, bios) requires authentication. Public users see only the current board roster when visibility is set to public. Simple authorization logic, but limits transparency.
    *   **Path B (Hybrid Exposure):** Historical composition data (names, titles, tenure dates) can be public, but bios and contact information require authentication. Requires more granular API design and frontend conditional rendering.
*   **Default Assumption & Required Action:** To minimize authorization complexity and align with the stated privacy-first philosophy, the system will implement **Path A (Complete Lockdown)**. **The specification must be updated** to explicitly define which historical data elements (if any) may be exposed to unauthenticated users and the rationale for this transparency tier.

**✓ DECISION: Path A (Complete Lockdown)**

**Answer:**
- All historical board data requires authentication: **names, titles, tenure dates, bios, contact information**
- **No historical data elements exposed to unauthenticated users**
- Public users see only current board roster when `board_visibility` config is set to `public`
- **API authorization:**
  - `GET /board/history` returns 401 Unauthorized for unauthenticated requests
  - Frontend routing: `/board/history` page requires login, redirects to login page if not authenticated
- **Authorization middleware:** Simple implementation - check `req.user` exists, no granular field-level permissions needed
- **Transparency rationale:**
  - Historical leadership records contain personal information (bios, tenure periods) that should remain private to the community
  - Public users can see who currently leads the HOA via the current board roster, which satisfies transparency requirements
  - Members-only access to history aligns with privacy-first philosophy and resident expectations
- **Rationale:** Simpler authorization logic reduces attack surface; aligns with privacy-first philosophy

---

#### **Assertion 5: Accessibility Suite Activation Persistence Scope**

*   **Observation:** The specification states high visibility mode is "persisted in localStorage" but does not define the persistence scope—per-device, per-browser, or ideally synced to the user's account profile for cross-device consistency.
*   **Architectural Impact:** This affects the user experience for residents who access the system from multiple devices (desktop, tablet, mobile) and determines whether backend schema changes are required.
    *   **Path A (Client-Only Persistence):** Use localStorage exclusively. Zero backend impact, but users must re-enable high visibility mode on each device. Acceptable for a small community where most users access from a single device.
    *   **Path B (Account-Synced Preference):** Add `accessibility_preferences` JSON column to the `Users` table and sync the setting across devices. Requires schema migration, backend API updates, and context initialization logic to fetch user preferences on login.
*   **Default Assumption & Required Action:** Given the small user base and development velocity priority, the system will implement **Path A (Client-Only Persistence)**. **The specification must be updated** to explicitly state whether cross-device preference synchronization is a requirement, or if per-device settings are acceptable for the initial release.

**✓ DECISION: Path A (Client-Only Persistence via localStorage)**

**Answer:**
- **Persistence scope:** Per-device, per-browser (not synced across devices)
- `AccessibilityContext` reads/writes to localStorage key: `hoa_accessibility_mode`
- **No backend changes required:**
  - No database column in `Users` table
  - No API endpoints for preference sync
  - No context initialization logic to fetch user preferences on login
- **User experience:** Users must re-enable high visibility mode on each device they use
- **Acceptable for initial release:** Small user base (~40 homes) likely accesses from 1-2 devices maximum; re-enabling on a second device is low friction
- **Future enhancement path:** If user feedback indicates cross-device synchronization is important, migrate to Path B in a future sprint:
  - Add `accessibility_preferences` JSON column to `Users` table
  - Update `AuthContext` to fetch preferences on login
  - Sync localStorage with backend on preference change
- **Rationale:** Zero backend impact; faster development velocity for v1.0; setting is simple enough that per-device configuration is acceptable

---

### **4.0 Next Steps**

✓ **COMPLETED:** All architectural decisions have been made and documented inline above. The original specification document (`specifications.md`) has been updated with section 2.5 containing all decisions and implementation details.

**Development is now unblocked and ready to proceed to the architectural design phase.**