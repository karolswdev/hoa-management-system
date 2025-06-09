# Integration Plan

## Goal

To successfully integrate the newly developed React frontend with the Node.js backend API, ensuring all functionalities work end-to-end as expected. This phase also includes setting up and testing any third-party services (like email) and preparing the application for robust deployment, including using Docker.

## Expected Output

A fully integrated HOA application where the React frontend seamlessly communicates with the Node.js backend via defined API contracts. All features specified in the frontend and backend plans will be operational and tested across different user roles. External services will be correctly configured and functioning. The application will be packaged as Docker images, and local Docker Compose orchestration will be verified.

---

## Epic: API Endpoint Connection & End-to-End Feature Testing

### User Story 47: Integrate and Test User Authentication Flow (Registration, Login, Logout)
*   **As a** QA/dev team member,
*   **I want** to thoroughly test the complete user authentication lifecycle by connecting the React frontend (Login, Registration pages, Header) to the Node.js backend authentication API endpoints (`/api/auth/register`, `/api/auth/login`), verifying token generation, client-side storage, authenticated requests, and logout procedures.
*   **So that** users can securely register, log in, maintain sessions, access role-appropriate content, and log out, forming the security foundation of the application.

    **Technical Requirements & Testing Steps:**
    1.  **Environment Sanity Check:**
        *   Backend (Node.js): Running, accessible (e.g., `http://localhost:3001` if local), CORS configured to allow requests from the React dev server URL (e.g., `http://localhost:3000` or `http://localhost:5173` for Vite).
        *   Frontend (React): Dev server running, `REACT_APP_API_URL` (or `VITE_API_URL`) environment variable correctly set to the backend URL.
    2.  **Registration:**
        *   **Action:** Navigate to the React registration page (`/register`). Fill and submit the registration form with valid new user data.
        *   **Frontend Verification (Browser DevTools - Network Tab):** Observe a `POST` request to `/api/auth/register`. Inspect payload (name, email, password) and response (e.g., 201 Created, success message).
        *   **Frontend Verification (UI):** Confirm a success message like "Registration successful. Your account is pending approval" is displayed.
        *   **Backend Verification (Logs & DB):** Check Node.js server logs for request processing. Query the SQLite `users` table to verify a new user record with `status: 'pending'`, `role: 'member'`, and a hashed password.
    3.  **Login with Pending User:**
        *   **Action:** Attempt to log in via the React login page (`/login`) using the newly registered (pending) user's credentials.
        *   **Frontend Verification (Network Tab):** Observe `POST /api/auth/login`. Inspect response (e.g., 403 Forbidden, error message "Account pending approval").
        *   **Frontend Verification (UI):** Confirm the specific error message is displayed on the login page.
    4.  **Account Approval (Simulated/Actual):**
        *   Manually update the user's `status` to `'approved'` in the backend database, OR use the (to-be-tested) admin UI to approve the user if that part of the integration is ready.
    5.  **Login with Approved User:**
        *   **Action:** Log in with the now-approved user's credentials.
        *   **Frontend Verification (Network Tab):** Observe `POST /api/auth/login`. Inspect response (e.g., 200 OK, JWT in response body, user details).
        *   **Frontend Verification (Client State & UI):**
            *   Check `localStorage` (if used for token) or React Context state (via React DevTools) to confirm the JWT and user data are stored.
            *   Confirm redirection to the dashboard (`/dashboard`).
            *   Confirm UI elements (e.g., Header navigation) update to reflect authenticated state (e.g., "Logout" visible, user name displayed).
    6.  **Authenticated API Requests:**
        *   **Action:** Navigate to a protected page that fetches data (e.g., Dashboard loading announcements).
        *   **Frontend Verification (Network Tab):** Observe API requests (e.g., `GET /api/announcements`). Verify the `Authorization: Bearer <JWT>` header is present and correct.
    7.  **Logout:**
        *   **Action:** Click the "Logout" button in the React UI.
        *   **Frontend Verification (Client State & UI):** Confirm JWT is cleared from storage/context. Confirm redirection to `/login` or `/`. Confirm UI updates to unauthenticated state.
        *   **Frontend Verification (Access):** Attempt to navigate to a protected route (e.g., `/dashboard`). Verify redirection back to `/login`.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect network requests from React login/registration forms using browser developer tools:**
            *   Instruction: Verify that when the registration form is submitted, a `POST` request is made to the `/api/auth/register` endpoint with a JSON payload containing `name`, `email`, and `password`. Check for a 201 status and success message in the response.
            *   Instruction: Verify that when the login form is submitted with valid, approved credentials, a `POST` request is made to the `/api/auth/login` endpoint with a JSON payload containing `email` and `password`. Check for a 200 status and a response body containing a JWT (`token`) and user details.
            *   Instruction: Verify subsequent requests to protected API endpoints from the React app include an `Authorization: Bearer <token>` header with the received JWT.
        2.  **Inspect React application state (e.g., using React DevTools for Context or Redux state) and behavior after login/logout:**
            *   Instruction: Upon a successful login, confirm that the received JWT and user object are stored in the designated client-side state management solution (e.g., `AuthContext` and potentially `localStorage`).
            *   Instruction: Verify the user is programmatically redirected to `/dashboard` (or the intended post-login page) after successful login.
            *   Instruction: After logout, verify the JWT is cleared from client-side storage/state, and the user is redirected to `/login` or `/`.
        3.  **Inspect backend logs and the `users` table in the database:**
            *   Instruction: After a test registration, query the `users` table to confirm a new record exists with `status='pending'`.
            *   Instruction: After an admin approves the user (manually or via UI if integrated) and the user logs in, verify the backend logs show successful authentication.
        4.  **Test error paths:**
            *   Instruction: Attempt login with incorrect credentials; verify a 401 response from backend and appropriate error message in React UI.
            *   Instruction: Attempt login with correct credentials for a 'pending' user; verify a 403 response and relevant message in UI.

### User Story 48: Integrate and Test Document Management Features (User and Admin)
*   **As a** QA/dev team member,
*   **I want** to connect and test the React document management UI (public listing, user dashboard listing, admin CRUD panel) with the Node.js document API endpoints, verifying all functionalities including listing by permission, download, upload, approval, and deletion.
*   **So that** document sharing and administration works correctly and securely for all user roles.

    **Technical Requirements & Testing Steps:**
    1.  **Public Document Listing & Download (Guest User):**
        *   **Action:** Navigate to `/documents` in React UI without being logged in.
        *   **Frontend/Backend Verification:** Observe `GET /api/documents`. Verify only documents marked `is_public: true` AND `approved: true` are returned and displayed. Click download on one; verify `GET /api/documents/:id/download` is called and file downloads.
    2.  **Authenticated Member Document Listing & Download:**
        *   **Action:** Log in as a 'member'. Navigate to `/documents` or `/dashboard` (document section).
        *   **Frontend/Backend Verification:** Observe `GET /api/documents`. Verify all documents with `approved: true` (both public and private) are returned and displayed. Test download for a private, approved document.
    3.  **Admin Document Upload:**
        *   **Action:** Log in as 'admin'. Navigate to admin document management (`/admin/documents`). Use the upload form to upload a new PDF document with title "Test Admin PDF", description "Admin test", and mark "Is Public" as true. Then upload another, "Test Private PDF", with "Is Public" as false.
        *   **Frontend/Backend Verification:** Observe `POST /api/admin/documents` calls with `multipart/form-data`. Payloads correct. Backend responds 201. UI list updates.
        *   **Backend Verification (DB & File System):** Check `documents` table: "Test Admin PDF" should be `is_public: true`, `approved: true`. "Test Private PDF" should be `is_public: false`, `approved: false`. Files exist on server. Audit log entries created.
    4.  **Admin Document Approval:**
        *   **Action:** In admin UI, find "Test Private PDF" (should be 'Pending'). Click "Approve".
        *   **Frontend/Backend Verification:** Observe `PUT /api/admin/documents/:id/approve`. Backend responds 200. UI status updates to 'Approved'.
        *   **Backend Verification (DB):** "Test Private PDF" now `approved: true`. Audit log entry.
    5.  **Verify Member Access to Newly Approved Private Doc:**
        *   **Action:** Log out admin. Log in as 'member'. Navigate to `/documents`.
        *   **Frontend/Backend Verification:** "Test Private PDF" should now be listed and downloadable.
    6.  **Admin Document Deletion:**
        *   **Action:** Log in as 'admin'. Delete "Test Admin PDF". Confirm deletion in dialog.
        *   **Frontend/Backend Verification:** Observe `DELETE /api/admin/documents/:id`. Backend responds 200/204. UI list updates.
        *   **Backend Verification (DB & File System):** "Test Admin PDF" record deleted from DB. File removed from server. Audit log entry.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify frontend API calls for document operations using browser developer tools (Network tab):**
            *   Instruction: Guest user on `/documents` page: `GET /api/documents` is called.
            *   Instruction: Admin uploading document: `POST /api/admin/documents` with `FormData`.
            *   Instruction: Admin approving document: `PUT /api/admin/documents/:id/approve`.
            *   Instruction: Admin deleting document: `DELETE /api/admin/documents/:id`.
            *   Instruction: Any user downloading document: `GET /api/documents/:id/download`.
        2.  **Verify document listing and access permissions in React UI based on user role:**
            *   Instruction: As guest, ensure only documents where `is_public:true` AND `approved:true` are shown on `/documents`.
            *   Instruction: As 'member', ensure all documents where `approved:true` are shown on `/documents` or dashboard.
            *   Instruction: As 'admin', ensure all documents (regardless of `is_public` or `approved` status) are shown in the `/admin/documents` management UI.
        3.  **Verify successful document upload by admin:**
            *   Instruction: Confirm the React UI shows a success message and the new document appears in the admin list.
            *   Instruction: Check server's configured upload directory to ensure the physical file is present with a unique name.
            *   Instruction: Query `documents` table to verify a new record with correct metadata (title, paths, `uploaded_by`, `is_public`, and `approved` status based on `is_public` flag) exists.
        4.  **Verify document approval and deletion by admin:**
            *   Instruction: After admin approves a document, verify its status changes in the React UI and in the `documents` table (`approved: true`).
            *   Instruction: After admin deletes a document, verify it's removed from the React UI, the physical file is deleted from the server, and the record is removed from the `documents` table.
        5.  **Verify audit logs for admin document actions:**
            *   Instruction: Query the `audit_logs` table to confirm entries are created for admin uploads, approvals, and deletions of documents.

### User Story 49: Integrate and Test Announcement Management Features
*   **As a** QA/dev team member,
*   **I want** to connect and test the React announcement UI (user dashboard/home listing, admin CRUD panel) with the Node.js announcement API endpoints, verifying creation with rich text, listing, editing, and deletion.
*   **So that** announcements are correctly managed by admins and displayed to users.

    **Technical Requirements & Testing Steps:**
    1.  **Admin Create Announcement:**
        *   **Action:** Log in as 'admin'. Navigate to `/admin/announcements`. Use form with Rich Text Editor to create an announcement with formatted content (bold, list).
        *   **Frontend/Backend Verification:** `POST /api/admin/announcements` with title and HTML content. Backend 201. UI updates.
        *   **Backend Verification (DB):** New record in `announcements` table with sanitized HTML, `created_by`. Audit log.
    2.  **User View Announcements:**
        *   **Action:** Log in as 'member'. Navigate to `/dashboard` or `/`.
        *   **Frontend/Backend Verification:** `GET /api/announcements`. Newly created announcement is listed. Formatted HTML content renders correctly and safely in React UI.
    3.  **Admin Edit Announcement:**
        *   **Action:** As 'admin', edit the created announcement's title and content.
        *   **Frontend/Backend Verification:** `PUT /api/admin/announcements/:id` with updated data. Backend 200. UI updates.
        *   **Backend Verification (DB):** Record updated. Audit log.
    4.  **Admin Delete Announcement:**
        *   **Action:** As 'admin', delete the announcement.
        *   **Frontend/Backend Verification:** `DELETE /api/admin/announcements/:id`. Backend 200/204. UI updates.
        *   **Backend Verification (DB):** Record deleted. Audit log.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify frontend API calls for announcement operations:**
            *   Instruction: Admin creating announcement: `POST /api/admin/announcements` with `title` and HTML `content`.
            *   Instruction: User viewing announcements (dashboard/home): `GET /api/announcements`.
            *   Instruction: Admin editing announcement: `PUT /api/admin/announcements/:id`.
            *   Instruction: Admin deleting announcement: `DELETE /api/admin/announcements/:id`.
        2.  **Verify announcement creation and rich text handling:**
            *   Instruction: When admin creates an announcement using the React rich text editor, confirm the HTML content is sent to the backend.
            *   Instruction: Query the `announcements` table to verify the `content` is stored (ideally sanitized by the backend).
            *   Instruction: When viewing the announcement as a user, verify the formatted HTML content is rendered correctly and safely in the React UI.
        3.  **Verify UI updates and data consistency:**
            *   Instruction: After admin creates, edits, or deletes an announcement, verify the admin list UI updates.
            *   Instruction: After admin creates/edits, verify the user-facing announcement list updates correctly on next fetch.
        4.  **Verify audit logs for admin announcement actions:**
            *   Instruction: Query `audit_logs` for entries related to announcement creation, updates, and deletions.

### User Story 50: Integrate and Test Event Management Features
*   **As a** QA/dev team member,
*   **I want** to connect and test the React event UI (user dashboard listing, admin CRUD panel) with the Node.js event API endpoints, verifying creation with date/time pickers, listing, editing, and deletion.
*   **So that** community events are correctly managed and displayed.

    **Technical Requirements & Testing Steps:**
    (Similar detailed steps as Announcements, focusing on event-specific fields like `start_date`, `end_date`, `location`, and validation of date pickers and date logic).
    1.  **Admin Create Event:** Use MUI X Date/Time Pickers. Validate start < end.
    2.  **User View Upcoming Events:** Filter by `upcoming`.
    3.  **Admin Edit Event.**
    4.  **Admin Delete Event.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify frontend API calls for event operations:**
            *   Instruction: Admin creating event: `POST /api/admin/events` with `title`, `description`, `start_date`, `end_date`, `location`.
            *   Instruction: User viewing events (dashboard): `GET /api/events` (potentially with `?filter=upcoming`).
            *   Instruction: Admin editing event: `PUT /api/admin/events/:id`.
            *   Instruction: Admin deleting event: `DELETE /api/admin/events/:id`.
        2.  **Verify event creation with date/time pickers:**
            *   Instruction: When admin creates an event using MUI X Date/Time pickers, confirm the selected dates/times are correctly formatted (e.g., ISO 8601 strings) and sent to the backend.
            *   Instruction: Verify client-side and backend validation for `start_date` being before `end_date`.
        3.  **Verify UI updates and data consistency for events:**
            *   Instruction: Check admin list and user-facing lists update correctly after CRUD operations.
            *   Instruction: Ensure dates/times are displayed in a user-friendly format in the UI.
        4.  **Verify audit logs for admin event actions:**
            *   Instruction: Query `audit_logs` for entries related to event creation, updates, and deletions.

### User Story 51: Integrate and Test Discussion Management Features
*   **As a** QA/dev team member,
*   **I want** to connect and test the React discussion UI (listing, viewing threads/replies, creating threads/replies by users, admin moderation) with the Node.js discussion API endpoints.
*   **So that** users can engage in discussions and admins can moderate effectively.

    **Technical Requirements & Testing Steps:**
    1.  **User Create Thread:** Use Rich Text Editor.
    2.  **User Post Reply:** Use Rich Text Editor.
    3.  **User View Threads & Replies:** Test pagination, correct display of nested content.
    4.  **Admin Delete Thread:** Verify thread and all its replies are removed.
    5.  **Admin Delete Reply:** Verify only the specific reply is removed.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify frontend API calls for discussion operations:**
            *   Instruction: User creating thread: `POST /api/discussions` with `title` and HTML `content`.
            *   Instruction: User posting reply: `POST /api/discussions/:threadId/replies` with HTML `content`.
            *   Instruction: User viewing thread list: `GET /api/discussions`.
            *   Instruction: User viewing specific thread: `GET /api/discussions/:threadId`.
            *   Instruction: Admin deleting thread: `DELETE /api/admin/discussions/:threadId`.
            *   Instruction: Admin deleting reply: `DELETE /api/admin/discussions/replies/:replyId`.
        2.  **Verify rich text handling for threads and replies:**
            *   Instruction: Confirm HTML content from React Rich Text Editor is sent to backend for new threads/replies.
            *   Instruction: Verify stored (sanitized) HTML content is fetched and rendered correctly/safely in the thread/reply views.
        3.  **Verify discussion structure and data integrity:**
            *   Instruction: After creating a thread and replies, verify they are correctly associated in the backend (`parent_id`) and displayed hierarchically in the UI.
            *   Instruction: After admin deletes a thread, verify both the main thread and all its replies are removed from DB and UI.
            *   Instruction: After admin deletes a reply, verify only that reply is removed.
        4.  **Verify audit logs for admin discussion moderation:**
            *   Instruction: Query `audit_logs` for entries related to thread/reply deletions by admins.

### User Story 52: Integrate and Test Admin User Management Full Workflow
*   **As a** QA/dev team member,
*   **I want** to test the entire admin user management workflow: listing users, approving a 'pending' user, changing a user's role, changing a user's password, and deleting a user, ensuring all UI interactions correctly call backend APIs and reflect changes.
*   **So that** administrators can fully manage user accounts through the React UI.

    **Technical Requirements & Testing Steps:**
    (This story consolidates testing of the admin user management UI connected to already-defined backend APIs.)
    1.  **List Users:** Verify `/api/admin/users` populates the admin table.
    2.  **Approve User:** Find a 'pending' user. Click 'Approve'. Verify `PUT /api/admin/users/:id/status` is called. User status updates in UI and DB. Audit log.
    3.  **Change Role:** Select a user. Change role via dropdown. Verify `PUT /api/admin/users/:id/role`. Role updates in UI and DB. Audit log.
    4.  **Change Password:** Select user. Use 'Change Password' modal. Verify `PUT /api/admin/users/:id/password`. Success message. Audit log. (User should be able to log in with new password).
    5.  **Delete User:** Select user. Confirm deletion. Verify `DELETE /api/admin/users/:id`. User removed from UI and DB. Associated documents also deleted. Audit log.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify user list display:**
            *   Instruction: In `/admin/users`, confirm a `GET /api/admin/users` call is made and populates an MUI `<Table>` with user data.
        2.  **Test "Approve User" functionality:**
            *   Instruction: For a 'pending' user, click "Approve". Verify a `PUT /api/admin/users/:id/status` call is made with `{ status: 'approved' }`. Confirm UI and DB reflect the change. Audit log created.
        3.  **Test "Change Role" functionality:**
            *   Instruction: For a user, change their role using the UI dropdown. Verify a `PUT /api/admin/users/:id/role` call is made with `{ role: newRole }`. Confirm UI and DB reflect the change. Audit log created.
        4.  **Test "Change Password" functionality:**
            *   Instruction: For a user, use the "Change Password" modal. Verify a `PUT /api/admin/users/:id/password` call is made with `{ newPassword }`. Confirm a success message. Audit log created. Attempt login with the new password.
        5.  **Test "Delete User" functionality:**
            *   Instruction: For a user, click "Delete" and confirm. Verify a `DELETE /api/admin/users/:id` call is made. Confirm UI removes the user, DB record is deleted, and associated documents (files and DB entries) are deleted. Audit log created.

### User Story 53: Integrate and Test Admin Configuration Management
*   **As a** QA/dev team member,
*   **I want** to test the admin configuration management UI, ensuring it correctly fetches current configurations, allows admins to update values, and successfully calls the backend API to persist these changes.
*   **So that** site-wide settings can be managed by administrators.

    **Technical Requirements & Testing Steps:**
    1.  **View Config:** Navigate to `/admin/config`. Verify `GET /api/admin/config` is called, data populates form fields.
    2.  **Update Config:** Change a value (e.g., `hoa_name`). Click "Save". Verify `PUT /api/admin/config/:key` (or batch update) is called with new value. UI reflects change (or re-fetches). DB updated. Audit log.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify configuration display:**
            *   Instruction: In `/admin/config`, confirm a `GET /api/admin/config` call is made and populates editable fields (e.g., MUI `<TextField>`) with current key-value pairs.
        2.  **Test configuration update:**
            *   Instruction: Modify a configuration value in the UI and save. Verify a `PUT /api/admin/config/:key` call (or a batch update call) is made with the updated value(s).
            *   Instruction: Confirm the UI reflects the saved change (either immediately or on re-fetch). Query the `config` table in the DB to verify the update.
            *   Instruction: Verify an audit log entry is created for the configuration change.

### User Story 54: Integrate and Test Admin Audit Log Viewer
*   **As a** QA/dev team member,
*   **I want** to test the admin audit log viewer UI, ensuring it correctly fetches and displays paginated audit log entries from the backend API.
*   **So that** administrators can effectively monitor system activities.

    **Technical Requirements & Testing Steps:**
    1.  **View Audit Logs:** Navigate to `/admin/audit-logs`. Verify `GET /api/admin/audit-logs` is called (with pagination params).
    2.  **Test Pagination:** Use pagination controls. Verify correct API calls for subsequent pages are made and UI updates.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify audit log display:**
            *   Instruction: In `/admin/audit-logs`, confirm a `GET /api/admin/audit-logs` call is made (initially for the first page).
            *   Instruction: Verify the fetched audit log entries are displayed in an MUI `<Table>` with columns for Timestamp, Admin Name, Action, and Details.
        2.  **Test pagination functionality:**
            *   Instruction: If there are multiple pages of audit logs, use the MUI `<TablePagination>` controls. Verify that changing pages triggers new API calls with updated pagination parameters (e.g., `?page=2&limit=10`).
            *   Instruction: Confirm the table updates to show the correct set of logs for the selected page.

---

## Epic: Dockerization and Deployment Preparation

### User Story 58 (Reiteration for Integration context): Finalize and Test Build Scripts & Environment Configuration
*   **As a** DevOps/dev team member,
*   **I want** to finalize and test production build scripts for the React frontend, ensure the Node.js backend has a reliable production startup script, and comprehensively document all necessary environment variables for both,
*   **So that** the integrated application is fully prepared for consistent and repeatable deployments.

    **Technical Requirements & Testing Steps:**
    1.  **React Frontend Build Test:**
        *   **Action:** Execute `npm run build` (or `yarn build`).
        *   **Verification:** Confirm optimized static assets are generated in `dist/` (for Vite) or `build/` (for CRA).
        *   **Action:** Serve the static build locally (e.g., using `serve -s dist`). Access it in a browser.
        *   **Verification:** Perform a smoke test: login, navigate to a few pages, interact with a feature. Ensure the `REACT_APP_API_URL` (or `VITE_API_URL`) used by the build correctly points to the running backend.
    2.  **Node.js Backend Production Run Test:**
        *   **Action:** Create a `.env.production` file (or set system env vars) with production-like settings (e.g., different `PORT` if needed, production DB path if different, actual email service keys).
        *   **Action:** Run the backend using its production start script (e.g., `NODE_ENV=production npm start`).
        *   **Verification:** Backend starts without errors. Test API endpoints (e.g., with Postman) to confirm it's operational with these settings.
    3.  **CORS Policy Verification:**
        *   **Action:** With backend running in production mode and frontend build served locally (or from its intended production-like origin), test API calls from frontend.
        *   **Verification:** Ensure no CORS errors block communication. Backend `cors` middleware options should allow the frontend's origin.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify React frontend production build:**
            *   Instruction: Execute the frontend's production build script (e.g., `npm run build`). Confirm it completes successfully and creates an optimized bundle in the `dist` (or `build`) directory.
            *   Instruction: Serve the contents of the build directory using a local static server (e.g., `serve -s dist`). Access the application in a browser. Perform basic smoke tests (login, navigation) to ensure the build is functional and API calls are correctly configured (i.e., `VITE_API_URL` or `REACT_APP_API_URL` points to the running backend).
        2.  **Verify Node.js backend production startup:**
            *   Instruction: Ensure a `start` script is defined in the backend's `package.json` intended for production (e.g., `node server.js`).
            *   Instruction: Set `NODE_ENV=production` and any other production-specific environment variables (via a `.env` file loaded by `dotenv` or system environment variables). Start the backend using `npm start`. Verify it starts without errors and logs indicate it's running in production mode (if such logging exists).
        3.  **Verify and document all environment variables:**
            *   Instruction: Create/update a `.env.example` file in both frontend and backend projects, listing all required environment variables with descriptions and example values (e.g., `VITE_API_URL` for frontend; `PORT`, `DATABASE_PATH`, `JWT_SECRET`, `SENDGRID_API_KEY`, `ADMIN_EMAIL` for backend).
        4.  **Verify CORS configuration for production:**
            *   Instruction: Inspect the backend's CORS middleware setup. Confirm it's configured to allow requests from the intended production frontend domain(s) when `NODE_ENV` is 'production'. Test this by making requests from a frontend served from a different origin than `localhost` if possible (or by temporarily setting the frontend build to be served from a different port and adjusting CORS).

### User Story 59 (Reiteration for Integration context): Build and Test Dockerized Application with Docker Compose
*   **As a** DevOps/dev team member,
*   **I want** to build Docker images for the production-ready React frontend and Node.js backend, and use `docker-compose.yml` to orchestrate their local execution, including volume mounts for persistent data (SQLite DB, uploads),
*   **So that** I can verify the containerized application works end-to-end, simulating a deployment environment and ensuring all services interact correctly.

    **Technical Requirements & Testing Steps:**
    1.  **Review Dockerfiles:** Ensure `backend/Dockerfile` uses `--omit=dev` or `--production` for `npm install`, and `frontend/Dockerfile` performs a production build (`npm run build`) and serves static assets via Nginx/httpd.
    2.  **Review `docker-compose.yml`:**
        *   Verify services for `backend` and `frontend`.
        *   Ensure backend's `environment` section correctly passes all necessary env vars (or uses an `env_file`).
        *   Ensure frontend Nginx config correctly serves the SPA and proxies API requests to the `backend` service name if using Nginx as a reverse proxy (e.g., `proxy_pass http://backend:3000;`). Alternatively, ensure the frontend's `VITE_API_URL` is set to the backend's exposed Docker host port or a gateway URL.
        *   Verify volumes for SQLite DB file (e.g., `hoa_db_data:/app/database` inside container) and document uploads (e.g., `hoa_uploads_data:/app/uploads`).
    3.  **Build & Run:**
        *   **Action:** Execute `docker-compose up --build -d`.
        *   **Verification (Docker):** Check `docker ps` to see containers are running. Check `docker-compose logs -f backend frontend` for startup messages and errors.
    4.  **E2E Test in Docker Environment:**
        *   **Action:** Access the frontend application through the port exposed by Docker Compose for the frontend service (e.g., `http://localhost:8080`).
        *   **Verification:** Perform a comprehensive E2E test suite (manual or automated subset) covering all major features: registration, login, document upload/download, announcement creation/viewing, discussion interaction, admin functionalities.
    5.  **Data Persistence Test:**
        *   **Action:** Perform actions that create data (e.g., register user, upload document).
        *   **Action:** Execute `docker-compose down`.
        *   **Action:** Execute `docker-compose up -d` (without `--build` unless code changed).
        *   **Verification:** Access the application again. Verify the previously created data (user, document) still exists, confirming volume mounts are working correctly for the SQLite DB and uploads.
    6.  **Email Service Test (from within Docker):**
        *   **Action:** Trigger an action that sends an email (e.g., new user registration if admin notifications are set up).
        *   **Verification:** Check if the backend container can reach the email SaaS provider and if emails are sent/received. This might require ensuring Docker networking allows outbound connections.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Verify Dockerfiles are optimized for production:**
            *   Instruction: Backend `Dockerfile`: `npm ci --omit=dev` is used. Multi-stage builds are used if beneficial to reduce image size.
            *   Instruction: Frontend `Dockerfile`: A multi-stage build is used where the first stage builds the React app (`npm run build`) and the final stage uses a lightweight server (Nginx/httpd) to serve static assets from the build output.
        2.  **Inspect `docker-compose.yml` for correct service definitions and configurations:**
            *   Instruction: Verify `build` contexts point to the correct Dockerfile locations.
            *   Instruction: Confirm port mappings expose the frontend (e.g., Nginx port 80) and backend (e.g., Node.js port 3000) to the host.
            *   Instruction: Verify the `environment` or `env_file` for the backend service correctly defines all necessary runtime environment variables (e.g., `DATABASE_PATH` pointing to the path *inside the container* where the volume is mounted, `JWT_SECRET`, etc.).
            *   Instruction: Verify the frontend service (Nginx) is configured to correctly serve the React SPA (e.g., `nginx.conf` has `try_files $uri $uri/ /index.html;`). If Nginx is also acting as a reverse proxy for API calls to the backend, verify its proxy configuration (e.g., `location /api/ { proxy_pass http://backend_service_name:backend_port; }`).
            *   Instruction: Verify named volumes or host-mounted volumes are correctly defined for the SQLite database file (e.g., `my_db_volume:/usr/src/app/database`) and the document uploads directory (e.g., `my_uploads_volume:/usr/src/app/uploads`).
        3.  **Successfully build and run the application using `docker-compose up --build`:**
            *   Instruction: Execute `docker-compose up --build`. Verify both frontend and backend containers build and start without errors. Check logs using `docker-compose logs frontend backend`.
        4.  **Perform E2E smoke tests on the containerized application:**
            *   Instruction: Access the React frontend via the host port mapped in `docker-compose.yml`.
            *   Instruction: Test key user flows: registration, login, viewing/downloading a document, creating an announcement, admin login and viewing an admin page. Confirm frontend successfully communicates with the backend service (using the backend service name if Nginx proxies, or the mapped host port if frontend calls host directly).
        5.  **Test data persistence across `docker-compose down` and `up`:**
            *   Instruction: Create some data (e.g., register a new user, upload a document). Then run `docker-compose down`. Then run `docker-compose up` again. Access the application and verify the previously created user and document are still present and accessible.
        6.  **Test email sending functionality from within the Docker environment (if applicable):**
            *   Instruction: Trigger an action that should send an email (e.g., new user registration). Verify the email is sent and received. Check backend container logs for any errors related to connecting to the email service provider.