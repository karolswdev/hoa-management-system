Okay, this is a good set of API documentation! Now, let's create a comprehensive plan for testing this API.

## API Testing Plan: HOA Management System

**1. Introduction and Objectives**

*   **1.1 Purpose:** This document outlines the strategy, scope, resources, and schedule for testing the HOA Management System API.
*   **1.2 Objectives:**
    *   Verify that all API endpoints function as documented (request/response, status codes).
    *   Ensure data integrity and validation for all inputs.
    *   Validate authentication and authorization mechanisms for all protected endpoints and user roles.
    *   Test error handling and response consistency for invalid requests or server-side issues.
    *   Perform basic security checks (e.g., SQL injection via parameters, data exposure).
    *   Ensure reliability and stability of the API under typical load (though full performance testing is a separate scope).
    *   Confirm audit logging is triggered correctly for administrative actions.

**2. Scope of Testing**

*   **2.1 In Scope:**
    *   All API endpoints detailed in the API documentation.
    *   Functional testing of each endpoint:
        *   Auth (Register, Login, Forgot/Reset Password, Verify Token)
        *   Users (Self-Profile, Admin User Management CRUD)
        *   Documents (Public/User Listing & Download, Admin Document CRUD & Approval)
        *   Announcements (User Listing, Admin CRUD)
        *   Events (User Listing, Admin CRUD)
        *   Discussions (User Create Thread/Reply, Listing, View, Admin Delete Thread/Reply)
        *   Admin Configuration (Get/Update)
        *   Admin Audit Logs (Get)
    *   Data validation (input parameters, request bodies).
    *   Authentication (JWT verification).
    *   Authorization (role-based access control for admin vs. member vs. public endpoints).
    *   Error handling (correct HTTP status codes and error messages).
    *   Pagination and sorting where applicable.
    *   File upload functionality (for documents).
    *   Audit logging verification (checking if logs are created for relevant admin actions).
*   **2.2 Out of Scope (for this specific API test plan, may be covered elsewhere):**
    *   Frontend UI testing.
    *   Database schema integrity testing (assumed correct as per migrations).
    *   Infrastructure testing (server availability, network latency beyond API response times).
    *   Full-scale performance, load, and stress testing (basic checks for responsiveness are in scope).
    *   Usability testing (not applicable to API).
    *   Third-party email service delivery verification (API should trigger it, but actual delivery is external).

**3. Test Strategy**

*   **3.1 Levels of Testing:**
    *   **API Integration Testing:** Testing individual API endpoints to ensure they interact correctly with the database and other internal services/modules (e.g., auth service, document service). This will be the primary focus.
*   **3.2 Types of Testing:**
    *   **Functional Testing:** Verifying each endpoint's functionality against requirements.
    *   **Validation Testing:** Ensuring all input data is correctly validated.
    *   **Security Testing (Basic):**
        *   Authentication checks (valid, invalid, expired tokens).
        *   Authorization checks (role-based access).
        *   Input sanitization checks (e.g., for HTML content in announcements/discussions).
        *   Checking for common vulnerabilities like improper data exposure.
    *   **Error Handling Testing:** Verifying correct error codes and messages for various failure scenarios.
    *   **Negative Testing:** Testing with invalid inputs, incorrect methods, missing parameters, etc.
    *   **Boundary Value Analysis:** For fields with limits (e.g., string lengths, pagination limits).
    *   **Endpoint-Specific Logic:** Testing unique business rules for certain endpoints (e.g., document approval logic, event date validation).

**4. Test Environment and Setup**

*   **4.1 Test Server:** A dedicated backend server instance running the latest API code.
*   **4.2 Database:** A separate SQLite database instance for testing, reset or seeded before major test runs to ensure a consistent state.
*   **4.3 Test Data:**
    *   Pre-defined seed data (e.g., admin user, basic config, sample member users with different statuses).
    *   Dynamically generated data during tests (e.g., new users, documents).
*   **4.4 Configuration:** Test environment will use specific `.env` variables (e.g., for JWT secret, database path).
*   **4.5 Tools:** See section 5.

**5. Tools and Technologies**

*   **5.1 API Testing Framework:**
    *   **Jest (with Supertest):** Recommended for Node.js backend. Supertest allows easy HTTP requests against the Express app.
    *   Alternatively: Mocha + Chai + Chai-HTTP.
*   **5.2 HTTP Client (for manual/exploratory testing):**
    *   Postman or Insomnia.
*   **5.3 Mocking Library:**
    *   Jest's built-in mocking capabilities or Sinon.JS (if using Mocha).
*   **5.4 Test Data Generation:** Custom scripts or libraries like Faker.js.
*   **5.5 CI/CD Tool:** Jenkins, GitHub Actions, GitLab CI (for automating test execution).
*   **5.6 Version Control:** Git.

**6. Test Execution Plan**

*   **6.1 Test Phases:**
    *   **Setup:** Prepare test environment, seed database.
    *   **Smoke Testing:** Basic tests for critical path functionalities (e.g., admin login, core resource GET).
    *   **Comprehensive Functional Testing:** Execute detailed test cases for all endpoints and features.
    *   **Regression Testing:** Re-run relevant tests after bug fixes or new feature integrations.
*   **6.2 Test Execution Order (Suggested):**
    1.  Auth Endpoints (critical for accessing other protected routes).
    2.  Admin User Management (to create/manage test users).
    3.  Core User-Facing Read Endpoints (Documents, Announcements, Events, Discussions listing).
    4.  Admin Create/Update/Delete Endpoints for each resource.
    5.  User Create/Update/Delete Endpoints (Profile, Discussion replies).
    6.  Configuration & Audit Log Endpoints.
*   **6.3 Responsibilities:** Development team / QA team.

**7. Test Deliverables**

*   Test Plan (this document).
*   Test Cases (detailed steps, expected results, actual results).
*   Test Execution Reports.
*   Bug Reports (logged in an issue tracker).
*   Test Summary Report.

**8. Entry and Exit Criteria**

*   **8.1 Entry Criteria:**
    *   API documentation available and stable for the version under test.
    *   Test environment setup and accessible.
    *   Testable build deployed to the test environment.
    *   Seed data available/scripts ready.
*   **8.2 Exit Criteria:**
    *   All planned test cases executed.
    *   Defined percentage of test cases passed (e.g., 95% for critical, 90% for major).
    *   No outstanding critical or major bugs.
    *   Test summary report reviewed and approved.

**9. Risks and Mitigation**

*   **9.1 Test Data Management:**
    *   **Risk:** Inconsistent test data leading to flaky tests.
    *   **Mitigation:** Implement robust data seeding and cleanup strategies; reset DB before test suites.
*   **9.2 Environment Issues:**
    *   **Risk:** Test environment instability.
    *   **Mitigation:** Regular environment health checks; dedicated test environment.
*   **9.3 Changing Requirements:**
    *   **Risk:** API changes during the testing phase.
    *   **Mitigation:** Close communication with development; update test cases promptly.
*   **9.4 Scope Creep:**
    *   **Risk:** Trying to test too much beyond the defined scope.
    *   **Mitigation:** Adhere to the test plan; defer out-of-scope items.
*   **9.5 Resource Constraints:**
    *   **Risk:** Insufficient time or personnel for testing.
    *   **Mitigation:** Prioritize tests based on risk and criticality; automate repetitive tests.

**10. Detailed Test Case Categories (Examples)**

*This section will outline categories. Actual test cases would be more granular.*

*   **10.1 Authentication (`/auth`)**
    *   **10.1.1 `POST /auth/register`**
        *   Test successful registration (201).
        *   Test registration with existing email (409).
        *   Test with missing required fields (400).
        *   Test with invalid email format (400).
        *   Test with password not meeting complexity (400).
    *   **10.1.2 `POST /auth/login`**
        *   Test successful login with approved user (200, JWT returned).
        *   Test login with incorrect password (401).
        *   Test login with non-existent email (401).
        *   Test login with 'pending' status user (403).
        *   Test login with 'rejected' status user (403).
        *   Test with missing fields (400).
    *   **10.1.3 `POST /auth/forgot-password`**
        *   Test successful request with valid email (200).
        *   Test with non-existent email (404).
        *   Test with email of non-approved user (400).
        *   Test with invalid email format (400).
    *   **10.1.4 `GET /auth/verify-reset-token`**
        *   Test with valid, unexpired token (200).
        *   Test with invalid token (400).
        *   Test with expired token (400).
        *   Test with missing token query param (400).
    *   **10.1.5 `POST /auth/reset-password`**
        *   Test with valid token and valid new password (200).
        *   Test with invalid/expired token (400).
        *   Test with new password not meeting complexity (400).
        *   Test with missing token or newPassword (400).
        *   Test token reuse attempt (should fail).

*   **10.2 Users (Self-Management - `/users/me`)**
    *   **10.2.1 `GET /users/me`**
        *   Test successful retrieval (200).
        *   Test without token (401).
        *   Test with invalid/expired token (401).
    *   **10.2.2 `PUT /users/me`**
        *   Test successful name update (200).
        *   Test with empty name (400).
        *   Test updating other fields (should be ignored or error if disallowed).
        *   Test without token (401).
    *   **10.2.3 `PUT /users/me/password`**
        *   Test successful password change (200).
        *   Test with incorrect current password (403).
        *   Test with new password not meeting complexity (400).
        *   Test with missing fields (400).
        *   Test without token (401).

*   **10.3 Admin: User Management (`/admin/users`)**
    *   **10.3.1 General**
        *   Test all endpoints without admin role (should get 403).
        *   Test all endpoints without token (should get 401).
    *   **10.3.2 `GET /admin/users`**
        *   Test successful listing (200).
        *   Test pagination (`limit`, `offset`).
        *   Verify non-system users are listed, system users are excluded.
    *   **10.3.3 `GET /admin/users/{userId}`**
        *   Test successful retrieval of non-system user (200).
        *   Test retrieval of non-existent user (404).
        *   Test retrieval of system user (should be 404 or specific error).
    *   **10.3.4 `PUT /admin/users/{userId}/status`**
        *   Test updating status (approved, pending, rejected) for non-system user (200).
        *   Test with invalid status value (400).
        *   Test on non-existent user (404).
        *   Test on system user (403).
        *   Verify audit log.
    *   **10.3.5 `PUT /admin/users/{userId}/role`**
        *   Test updating role (admin, member) for non-system user (200).
        *   Test with invalid role value (400).
        *   Test on non-existent user (404).
        *   Test on system user (403).
        *   Verify audit log.
    *   **10.3.6 `DELETE /admin/users/{userId}`**
        *   Test deleting non-system user (200/204).
        *   Verify associated documents are deleted (file system & DB).
        *   Test on non-existent user (404).
        *   Test on system user (403).
        *   Verify audit log.
    *   **10.3.7 `PUT /admin/users/{userId}/password`**
        *   Test changing password for non-system user (200).
        *   Test with new password not meeting complexity (400).
        *   Test on non-existent user (404).
        *   Test on system user (403).
        *   Verify audit log.

*   **10.4 Documents (`/documents` and `/admin/documents`)**
    *   **10.4.1 `GET /documents` (Public/User)**
        *   Test as guest (only public, approved documents).
        *   Test as authenticated member (all approved documents).
        *   Test as admin (all documents, for admin panel).
        *   Test pagination.
    *   **10.4.2 `GET /documents/{documentId}` (Public/User Metadata)**
        *   Test access permissions for guest, member, admin.
        *   Test non-existent document (404).
    *   **10.4.3 `GET /documents/{documentId}/download` (Public/User Download)**
        *   Test access permissions (public/approved for guest; approved for member; all for admin).
        *   Test download of different file types (if applicable).
        *   Test non-existent document (404).
    *   **10.4.4 `POST /admin/documents` (Admin Upload)**
        *   Test successful upload with various allowed file types.
        *   Test file size limit.
        *   Test disallowed file type.
        *   Test with missing title/is_public (400).
        *   Verify `is_public:true` also sets `approved:true`.
        *   Verify `is_public:false` sets `approved:false`.
        *   Verify physical file storage.
        *   Verify audit log.
    *   **10.4.5 `PUT /admin/documents/{id}/approve` (Admin Approve)**
        *   Test approving a pending document (200).
        *   Test approving an already approved document.
        *   Test on non-existent document (404).
        *   Verify audit log.
    *   **10.4.6 `DELETE /admin/documents/{id}` (Admin Delete)**
        *   Test deleting a document (204).
        *   Verify physical file deletion.
        *   Test on non-existent document (404).
        *   Verify audit log.

*   **10.5 Announcements (`/announcements`)**
    *   **10.5.1 `GET /announcements` (User List)**
        *   Test as authenticated user (member/admin).
        *   Test filtering by status 'active' (non-expired).
        *   Test pagination and sorting.
    *   **10.5.2 `POST /announcements` (Admin Create)**
        *   Test successful creation with title, content, optional expiresAt.
        *   Test with HTML content (verify sanitization by checking stored value).
        *   Test with expiresAt in the past (400).
        *   Test missing required fields (400).
        *   Verify audit log.
    *   **10.5.3 `PUT /announcements/{id}` (Admin Update)**
        *   Test updating title, content, expires_at.
        *   Test setting expires_at to null.
        *   Test on non-existent announcement (404).
        *   Verify audit log.
    *   **10.5.4 `DELETE /announcements/{id}` (Admin Delete)**
        *   Test deleting an announcement (204).
        *   Test on non-existent announcement (404).
        *   Verify audit log.

*   **10.6 Events (`/events`)**
    *   **10.6.1 `GET /events` (User List)**
        *   Test as authenticated user.
        *   Test filtering by status (`upcoming`, `past`).
        *   Test pagination and sorting (`event_date`, `title`, `created_at`).
    *   **10.6.2 `POST /events` (Admin Create)**
        *   Test successful creation with valid data.
        *   Test `event_date` in the past (400).
        *   Test missing required fields (400).
        *   Verify audit log.
    *   **10.6.3 `PUT /events/{id}` (Admin Update)**
        *   Test updating various fields.
        *   Test `end_date` before `start_date` (400).
        *   Test on non-existent event (404).
        *   Verify audit log.
    *   **10.6.4 `DELETE /events/{id}` (Admin Delete)**
        *   Test deleting an event (204).
        *   Test on non-existent event (404).
        *   Verify audit log.

*   **10.7 Discussions (`/discussions`)**
    *   **10.7.1 `POST /discussions` (User Create Thread)**
        *   Test successful creation with title, content.
        *   Test with HTML content.
        *   Test missing fields (400).
    *   **10.7.2 `POST /discussions/{threadId}/replies` (User Create Reply)**
        *   Test successful reply to existing thread.
        *   Test reply to non-existent thread (404).
        *   Test with HTML content.
        *   Test missing content (400).
    *   **10.7.3 `GET /discussions` (User List Threads)**
        *   Test successful listing with author, reply_count.
        *   Test pagination.
    *   **10.7.4 `GET /discussions/{threadId}` (User View Thread)**
        *   Test successful retrieval of thread and its replies.
        *   Test with non-existent threadId (404).
    *   **10.7.5 `DELETE /discussions/{threadId}` (Admin Delete Thread)**
        *   Test deleting a thread (204).
        *   Verify replies are also deleted.
        *   Test on non-existent thread (404).
        *   Verify audit log.
    *   **10.7.6 `DELETE /discussions/replies/{replyId}` (Admin Delete Reply)**
        *   Test deleting a specific reply (204).
        *   Test on non-existent reply (404).
        *   Verify audit log.

*   **10.8 Admin: Configuration (`/admin/config`)**
    *   **10.8.1 `GET /admin/config`**
        *   Test successful retrieval of all configs (200).
    *   **10.8.2 `PUT /admin/config/{key}`**
        *   Test updating an existing key (e.g., `hoa_name`) (200).
        *   Test creating a new key (upsert behavior).
        *   Test with empty value (400).
        *   Verify audit log.

*   **10.9 Admin: Audit Logs (`/admin/audit-logs`)**
    *   **10.9.1 `GET /admin/audit-logs`**
        *   Test successful retrieval (200).
        *   Verify admin_name is joined.
        *   Verify details are correctly formatted (parsed JSON if applicable).
        *   Test pagination.
        *   Perform an admin action and verify it appears in the logs.

**11. Test Automation Strategy**

*   Prioritize automation of:
    *   Auth flows.
    *   CRUD operations for each resource (happy paths).
    *   Key validation and error handling scenarios.
    *   Authorization checks for critical admin endpoints.
*   Automated tests should be integrated into the CI/CD pipeline.

**12. Sign-off**

This section will be filled upon completion and review of testing activities.

---

This plan provides a structured approach to testing the HOA Management System API. Detailed test cases would be derived from each category outlined in section 10.