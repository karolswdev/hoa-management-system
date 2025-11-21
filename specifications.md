# HOA Management System - Extension Roadmap

## 1. Executive Summary

This document outlines the technical roadmap for extending the HOA Management System. The primary goals are to enhance community governance through transparent voting, improve accessibility for elderly residents, and formalize board management.

**Constraints:**
- **Infrastructure:** 1GB RAM Linode (SQLite database).
- **User Base:** Small (~40 homes), primarily elderly.
- **Philosophy:** Simplicity, Stability, and Security.

---

## 2. Feature Specifications

### 2.1. Board Member Management & History

**Objective:** Provide a clear, historical record of community leadership.

**User Stories:**
- *As a Resident*, I want to see who is currently on the board so I know who to contact.
- *As a Member*, I want to view the history of board changes to understand past leadership.
- *As an Admin*, I want to easily reassign board roles without manually tracking dates.

**Technical Implementation:**

*   **Database Schema:**
    *   `BoardTitles`: `id` (PK), `title` (e.g., President, Treasurer), `rank` (for sorting).
    *   `BoardMembers`: `id` (PK), `user_id` (FK), `title_id` (FK), `start_date`, `end_date` (nullable).

*   **Logic:**
    *   When assigning a user to a title (e.g., "President"), the system checks if anyone currently holds that title.
    *   If yes, the current holder's `end_date` is set to `NOW`.
    *   The new holder is inserted with `start_date = NOW` and `end_date = NULL`.

*   **UI/UX:**
    *   **Public/Dashboard:** "Current Board" card showing names and titles.
    *   **History Page:** A timeline or table view of past board members (Member only).

### 2.2. Accessibility Mode ("High Visibility")

**Objective:** Ensure the application is usable by residents with reduced visual acuity without stigmatizing the feature.

**User Stories:**
- *As a User*, I can toggle a "High Visibility" mode that increases contrast and font size.
- *As a User*, I can easily understand what the toggle does via a tooltip.

**Technical Implementation:**

*   **State Management:** React Context (`AccessibilityContext`) persists the preference to `localStorage`.
*   **Theming (MUI):**
    *   Standard Mode: Current Brand Colors.
    *   High Vis Mode:
        *   `contrastText`: Pure Black/White.
        *   `fontSize`: Base size increased by 25% (e.g., 14px -> 17.5px).
        *   `borders`: Thicker (2px solid).
*   **UI Component:** A distinct icon button (e.g., Eye icon or "Aa") in the top navigation bar with a tooltip: *"Increase text size and contrast for better visibility"*.

### 2.3. The "Democracy" Module: Polls & Secure Voting

**Objective:** Enable digital governance for informal opinion gathering and formal binding votes (Proxy/Meeting alternatives) with auditability that rivals paper trails.

**User Stories:**
- *As an Admin*, I can create a poll and choose if it is "Anonymous" or "Transparent".
- *As an Admin*, I can designate a poll as a "Formal Vote" which implies stricter audit logging.
- *As a Member*, I can clearly see if my vote will be anonymous before I cast it.
- *As a Member*, I receive a "Receipt" (hash) of my vote to verify it was counted.
- *As an Auditor*, I can verify that the vote database has not been tampered with.

**Technical Implementation:**

*   **Database Schema:**
    *   `Polls`: `id`, `title`, `description`, `type` ('informal', 'binding'), `is_anonymous`, `start_at`, `end_at`.
    *   `PollOptions`: `id`, `poll_id`, `text`.
    *   `Votes`: `id`, `poll_id`, `user_id` (nullable if strict anon), `option_id`, `timestamp`, `prev_hash`, `vote_hash`.

*   **Integrity Mechanism (Hash Chain):**
    *   To address regulatory concerns on a lightweight stack, we implement a **Hash Chain** (a linear blockchain) within the SQLite `Votes` table.
    *   **Formula:** `vote_hash_N = SHA256( user_id + option_id + timestamp + vote_hash_{N-1} )`
    *   **Verification:** A utility script runs periodically (or on demand) to recalculate the chain. If `CalculatedHash != StoredHash`, tampering is detected.
    *   **Receipts:** The user is presented with their `vote_hash` upon success. They can compare this against the published results (if transparent) or a verify tool.

*   **Email Integration:**
    *   Checkbox on Poll Creation: "Notify Members via Email".
    *   Uses existing SendGrid integration to dispatch links to the new poll.

### 2.4. Vendor Directory

**Objective:** A community-curated list of trusted service providers.

**Technical Implementation:**
*   **Database Schema:** `Vendors`: `id`, `name`, `category` (Plumbing, landscaping), `phone`, `email`, `website`, `recommended_by_user_id`.
*   **UI:** Simple card grid or list with filter-by-category.

---

## 3. CI/CD & Deployment Enhancements

**Objective:** Maintain the automated pipeline while enhancing security and reliability.

**Enhancements:**
1.  **Security Scanning:**
    *   Add `npm audit` to the CI pipeline to block builds with critical vulnerabilities.
    *   Continue using `gitleaks` for secret scanning.
2.  **Health Checks:**
    *   Update `deploy.yml` to run a container health check *before* the final push to GHCR or immediately after deployment to verifying the endpoint returns `200 OK`.
3.  **Database Backups:**
    *   Ensure the SQLite file is backed up to S3 (or similar off-site storage) before every deployment, not just local retention.

---

## 4. Implementation Phases

1.  **Phase 1: Foundation**
    *   Implement `BoardTitles` and `BoardMembers` schema.
    *   Implement Accessibility Context and Theme overrides.
2.  **Phase 2: The Democracy Engine**
    *   Build the Voting Hash Chain logic (Backend).
    *   Build the Polls UI (Frontend).
3.  **Phase 3: Community Extras**
    *   Vendor Directory.
    *   Refinement of UI for elderly users based on feedback.
