# HOA Management System - Extension Roadmap

## 1. Executive Summary

This document outlines the technical roadmap for extending the HOA Management System. The primary goals are to enhance community governance through transparent voting, improve accessibility for all residents via the **Accessibility Suite**, and formalize board management.

**Constraints:**
- **Infrastructure:** 1GB RAM Linode (SQLite database).
- **User Base:** Small (~40 homes).
- **Philosophy:** Simplicity, Stability, and Security.

---

## 2. Feature Specifications

### 2.1. Board Member Management & History

**Objective:** Provide a clear, historical record of community leadership and enable secure communication.

**Functional Requirements:**
1.  **Board Roster:** Display current board members with their titles.
2.  **History:** Maintain a complete history of who held which title and when. **Note:** While the current roster visibility can be toggled, the *history* view must strictly remain accessible only to authenticated members.
3.  **Contact Board:** Allow residents to email the board directly without exposing personal email addresses.
4.  **Visibility Control:** Admins can toggle whether the *current* board list is visible to the public (guests) or members only.

**Technical Implementation:**

*   **Database Schema:**
    *   `BoardTitles`: `id` (PK), `title` (e.g., President), `rank` (int, for sorting).
    *   `BoardMembers`: `id` (PK), `user_id` (FK), `title_id` (FK), `start_date`, `end_date` (nullable), `bio` (text, optional).
    *   **Config Setting:** Key `board_visibility` with value `public` or `members_only` (stored in `Config` table).

*   **Backend Logic:**
    *   **Controllers:**
        *   `backend/src/controllers/board.controller.js`: Endpoints for `GET /board` (public/member check), `POST /board/contact` (email dispatch), and CRUD for titles/members (admin).
    *   **Email Integration:**
        *   `backend/src/services/email.service.js`: Update to handle a new `sendBoardContactEmail` payload.
        *   The system will lookup active board members and dispatch the message to their registered email addresses via SendGrid.
    *   **Routes:**
        *   `backend/src/routes/board.routes.js`: Define new routes.

*   **Frontend UI:**
    *   `frontend/src/pages/Board.tsx`: Main view. Fetches visibility config first.
    *   `frontend/src/components/Board/ContactForm.tsx`: A modal or inline form.
    *   `frontend/src/pages/admin/BoardManagement.tsx`: Admin interface for assigning roles.

### 2.2. Accessibility Suite

**Objective:** Ensure the application is universally usable, providing high-contrast visuals and contextual guidance for users who may need assistance.

**Functional Requirements:**
1.  **High Visibility Mode:** A toggle that switches the site to a high-contrast, larger-font theme.
2.  **Contextual Help:** When the suite is active, additional "Help" icons appear next to complex form fields, offering plain-language explanations.

**Technical Implementation:**

*   **State Management:**
    *   `frontend/src/contexts/AccessibilityContext.tsx`: New React Context to manage `isHighVisibility` state (persisted in `localStorage`).

*   **Theming (MUI):**
    *   `frontend/src/theme/theme.ts`:
        *   Refactor to export a function `createAppTheme(mode: 'standard' | 'high-vis')`.
        *   **High Vis Specs:**
            *   `palette.primary.main`: `#000000` (Black) or `#003366` (Deep Navy).
            *   `palette.background.default`: `#FFFFFF` (Pure White).
            *   `typography.fontSize`: Scale up base size by 20-25%.
            *   `components.MuiButton`: Increase padding and border thickness.

*   **UI Components:**
    *   `frontend/src/components/Accessibility/Toggle.tsx`: A prominent button in the `Navbar` (e.g., "Aa" icon) with a tooltip: *"Increase text size and contrast for better visibility"*.
    *   `frontend/src/components/common/FormHelper.tsx`: A component that renders a generic `?` icon only when `AccessibilityContext.isHighVisibility` is true. Hovering shows a popover with the helper text.

### 2.3. The "Democracy" Module: Polls & Secure Voting

**Objective:** Enable digital governance for informal polls and formal binding votes (Proxy/Meeting alternatives) with auditability.

**Functional Requirements:**
1.  **Poll Creation:** Admins create polls with options and can optionally **email all members** to notify them.
2.  **Voting Types:**
    *   **Informal:** Simple counts.
    *   **Binding:** Strict audit logging, secure "receipts".
3.  **Integrity:** Use a cryptographic Hash Chain to prevent tampering.
4.  **Receipts:** Users receive a unique hash code to verify their vote was counted.

**Technical Implementation:**

*   **Database Schema:**
    *   `Polls`: `id`, `title`, `description`, `type` ('informal', 'binding'), `is_anonymous`, `start_at`, `end_at`.
    *   `PollOptions`: `id`, `poll_id`, `text`.
    *   `Votes`: `id`, `poll_id`, `user_id` (nullable if strict anon), `option_id`, `timestamp`, `prev_hash`, `vote_hash`.

*   **Backend Logic (Hash Chain):**
    *   `backend/src/services/vote.service.js`:
        *   **Hash Formula:** `SHA256( user_id + option_id + timestamp + prev_vote_hash )`.
        *   On every vote insertion, lock the table (or use serial transaction), fetch the last `vote_hash`, calculate the new one, and insert.
    *   `backend/src/controllers/poll.controller.js`: endpoints for creating polls and casting votes.
    *   **Email Integration:**
        *   `backend/src/services/email.service.js`: Update to handle `sendPollNotificationEmail`.
        *   Admin UI checkbox "Notify Members" triggers this service upon poll creation.

*   **Frontend UI:**
    *   `frontend/src/pages/Polls.tsx`: List of active/past polls.
    *   `frontend/src/pages/PollDetail.tsx`: Voting interface. Displays the "Vote Receipt" (hash) clearly after submission.

### 2.4. Vendor Directory

**Objective:** A community-curated list of trusted service providers.

**Technical Implementation:**
*   **Schema:** `Vendors` table.
*   **Code Impact:**
    *   `backend/src/models/vendor.model.js`
    *   `backend/src/controllers/vendor.controller.js`
    *   `frontend/src/pages/Vendors.tsx`

---

## 2.5. Architectural Decisions & Clarifications

This section addresses critical decision points identified during specification review (see `.codemachine/artifacts/requirements/00_Specification_Review.md`).

### 2.5.1. Voting Anonymity vs. Auditability

**Decision:** **Path A (Pseudonymous Auditability)**

**Rationale:**
- HOA votes typically require attribution for legal binding purposes (quorum verification, contested decisions)
- The 1GB RAM constraint makes complex zero-knowledge proof systems impractical
- The small community size (~40 homes) means sophisticated cryptographic anonymity adds unnecessary complexity

**Implementation Details:**
- The `is_anonymous` flag controls **UI display only** - voter names are hidden from results screens but votes remain attributed in the database
- All votes include `user_id` in the hash chain formula for full auditability
- Admin audit logs can reconstruct who voted for what if legally required
- Clear privacy policy disclosure: "Votes are recorded with your identity for audit purposes but displayed anonymously to other members"

**Legal Compliance:** Vote records with full attribution will be retained for 7 years per standard HOA document retention policies.

---

### 2.5.2. Hash Chain Integrity vs. SQLite Concurrency

**Decision:** **Tier 1 (Sequential Processing with Vote Queue)**

**Rationale:**
- With ~40 homes, the probability of concurrent vote submissions is negligible
- Even if all 40 residents vote within a 5-minute window, sequential processing handles this easily
- No additional infrastructure (Redis/PostgreSQL) required - maintains simplicity

**Implementation Details:**
- Implement in-memory vote submission queue in `backend/src/services/vote.service.js`
- Process votes sequentially with SQLite transactions to maintain hash chain integrity
- Expected latency: 100-300ms per vote (acceptable for this use case)
- Queue monitoring: Admin dashboard shows pending vote queue depth

**Acceptable Load:** System designed to handle all 40 residents voting within a 10-minute window without issues. If concurrent load increases in the future, migration to Tier 2 (Redis) is straightforward.

---

### 2.5.3. Email Notification Strategy for Poll Creation

**Decision:** **Path C (Hybrid with Retry)**

**Rationale:**
- Balances reliability with infrastructure simplicity
- No webhook endpoints or Redis required
- Provides admin visibility into email failures without real-time delivery confirmation overhead

**Implementation Details:**
- Use SQLite-backed job queue table: `EmailQueue` (`id`, `recipient`, `subject`, `body`, `attempts`, `last_attempt`, `status`)
- Background worker retries failed emails: 3 attempts over 24 hours (immediate, +1 hour, +23 hours)
- Admin dashboard displays email delivery statistics per poll
- Log all email failures to admin notification panel

**SLA Expectations:**
- 95% of emails delivered within 5 minutes
- Failed emails surface in admin dashboard within 1 hour
- No guarantee of delivery for invalid email addresses (admin notified)

---

### 2.5.4. Board History Access Control Scope

**Decision:** **Path A (Complete Lockdown)**

**Rationale:**
- Aligns with privacy-first philosophy and resident expectations
- Simpler authorization logic reduces attack surface
- Current board visibility toggle provides sufficient public transparency

**Implementation Details:**
- All historical board data (names, titles, tenure dates, bios, contact info) requires authentication
- Public users see only current board roster when `board_visibility` is set to `public`
- API authorization middleware: `GET /board/history` returns 401 for unauthenticated requests
- Frontend routing: `/board/history` page requires login

**Transparency Rationale:** Historical leadership records contain personal information (bios, tenure periods) that should remain private to the community. Public users can see who currently leads the HOA, which satisfies transparency requirements.

---

### 2.5.5. Accessibility Suite Activation Persistence Scope

**Decision:** **Path A (Client-Only Persistence via localStorage)**

**Rationale:**
- Small user base (~40 homes) likely accesses from 1-2 devices maximum
- Zero backend impact - no schema changes or API updates required
- Faster development velocity for initial release
- Setting is simple enough that re-enabling on a second device is low friction

**Implementation Details:**
- `AccessibilityContext` reads/writes to `localStorage` key: `hoa_accessibility_mode`
- No database column required in `Users` table
- Per-device setting acceptable for v1.0 release

**Future Enhancement:** If user feedback indicates cross-device synchronization is important, migrate to Path B (account-synced preferences) in a future sprint. This would require:
- Add `accessibility_preferences` JSON column to `Users` table
- Update `AuthContext` to fetch preferences on login
- Sync localStorage with backend on preference change

---

## 3. CI/CD & Deployment Enhancements

**Objective:** Maintain the automated pipeline while enhancing security and reliability.

**Code Impact:**
1.  **Security Scanning:**
    *   Edit `.github/workflows/ci.yml`: Add `npm audit --audit-level=critical` step.
2.  **Health Checks:**
    *   Edit `.github/workflows/deploy.yml`: Add a step to run the docker container and `curl` the health endpoint before pushing to GHCR.
