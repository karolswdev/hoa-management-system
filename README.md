# HOA Community Hub

[![CI](https://github.com/karolswdev/hoa-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/karolswdev/hoa-management-system/actions/workflows/ci.yml)
[![Secret Scan](https://github.com/karolswdev/hoa-management-system/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/karolswdev/hoa-management-system/actions/workflows/gitleaks.yml)
[![CodeQL](https://github.com/karolswdev/hoa-management-system/actions/workflows/codeql.yml/badge.svg)](https://github.com/karolswdev/hoa-management-system/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-brightgreen?logo=dependabot)](./.github/dependabot.yml)

Welcome to the HOA Community Hub, a modern, full-stack web application designed to be the central digital point of contact for a Homeowners' Association and its residents. This platform streamlines communication, simplifies document access, manages community events, and provides essential administrative tools.

## Live

- Production: https://sandersoncreekhoa.com/
- API base: https://sandersoncreekhoa.com/api/
- Health: https://sandersoncreekhoa.com/api/health

Notes
- Nginx enforces HTTPS and redirects `www.sandersoncreekhoa.com` → `sandersoncreekhoa.com`.
- Turnstile is enabled on Registration; SendGrid handles outbound email.

## Table of Contents

1.  [Vision & Purpose](#vision--purpose)
2.  [Core Features](#core-features)
3.  [Technology Stack](#technology-stack)
4.  [Project Structure](#project-structure)
5.  [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
6.  [Running the Application](#running-the-application)
7.  [Running Tests](#running-tests)
8.  [API Documentation](#api-documentation)
9.  [Deployment (Production)](#deployment-production)
10. [Contributing & Security](#contributing--security)

---

## Vision & Purpose

The goal of the HOA Community Hub is to replace fragmented communication channels like email chains and paper notices with a single, secure, and user-friendly platform. It empowers community administrators with the tools they need to manage the HOA efficiently while providing residents with easy access to information and a forum for discussion.

**User Personas:**
*   **Administrator:** Manages users, content, and site configuration.
*   **Resident (Member):** Accesses information, participates in discussions.
*   **Guest:** Views public-facing information about the HOA.

---

## Core Features

| Feature                | Administrator (`admin`)                                      | Resident (`member`)                                  | Guest (Unauthenticated)     |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------- | --------------------------- |
| **Authentication**     | ✅ Login/Logout                                              | ✅ Login/Logout, Register, Email Verify, Password Reset | ❌                       |
| **User Management**    | ✅ View, Approve/Reject, Change Role, Delete Users           | ✅ Manage Own Profile                                | ❌                          |
| **Announcements**      | ✅ Create, Edit, Delete, Optional Email Notify               | ✅ View                                              | ❌                          |
| **Events**             | ✅ Create, Edit, Delete                                      | ✅ View                                              | ❌                          |
| **Documents**          | ✅ Upload, Manage, Set Visibility                            | ✅ View & Download Approved Docs                     | ✅ View & Download Public Docs |
| **Discussions**        | ✅ Delete Threads/Replies                                    | ✅ Create/View Threads, Post Replies                 | ❌                          |
| **Site Configuration** | ✅ Edit Site Name/Description                                | ❌                                                   | ❌                          |
| **Audit Logs**         | ✅ View all administrative actions                           | ❌                                                   | ❌                          |
| **Email**              | ✅ SendGrid provider, approval/rejection, announcements, password reset, email verification | — | — |
| **CAPTCHA**            | —                                                           | ✅ Registration protected by Turnstile               | — |

---

## Technology Stack

*   **Backend:**
    *   **Framework:** Node.js with Express.js
    *   **Database:** SQLite3 (for simplicity and portability)
    *   **ORM:** Sequelize
    *   **Authentication:** JSON Web Tokens (JWT) + Email verification
    *   **Testing:** Jest & Supertest
    *   **Email:** SendGrid (adapter-based service)
    *   **CAPTCHA:** Cloudflare Turnstile (registration)
*   **Frontend:**
    *   **Framework:** React.js with TypeScript
    *   **UI Library:** Material-UI (MUI)
    *   **Routing:** React Router
    *   **State Management:** React Context API
    *   **Form Handling:** Formik & Yup
    *   **API Client:** Axios

---

## Project Structure

The project is a monorepo containing distinct `backend` and `frontend` applications.

## Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (v10.x or later recommended)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend/` directory by copying the example.
    ```bash
    # You can manually create a .env file and add the following:
    # A strong, secret key for signing JWTs
    JWT_SECRET=your_super_secret_key_here_123!
    JWT_EXPIRES_IN=8h

    # Default admin credentials for the initial database seed
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=AdminPassword123!

    # Email provider (SendGrid)
    EMAIL_PROVIDER=sendgrid
    EMAIL_FROM=no-reply@your-domain.com
    EMAIL_FROM_NAME=HOA Community Hub
    SENDGRID_API_KEY=your_sendgrid_api_key

    # Frontend base (for email links)
    FRONTEND_BASE_URL=http://localhost:3000

    # Password reset cooldown (minutes)
    PASSWORD_RESET_COOLDOWN_MINUTES=60

    # CAPTCHA (Cloudflare Turnstile)
    TURNSTILE_SECRET_KEY=your_turnstile_secret
    ```

4.  **Run database migrations and seeders:**
    This command will create the database schema and populate it with an initial admin user and default site configuration.
    ```bash
    npm run db:migrate
    npm run db:seed
    ```

### Frontend Setup

*(These steps are for when Phase 1 of the frontend is complete.)*

1.  **Navigate to the frontend directory:**
    ```bash
    # from the project root
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` (optional but recommended):**
    ```bash
    VITE_API_BASE_URL=http://localhost:3001/api
    # Turnstile site key (if protecting registration locally)
    VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
    # App name for document.title
    VITE_APP_NAME=Sanderson Creek HOA
    ```

---

## Running the Application

You will need two separate terminal windows to run the backend and frontend servers concurrently.

1.  **Start the Backend Server:**
    ```bash
    # In a terminal, from the backend/ directory
    npm start
    ```
    The API will be running on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    ```bash
    # In a second terminal, from the frontend/ directory
    npm start
    ```
    The React application will open in your browser, usually at `http://localhost:3000`.

Notes
- Registration requires email verification. Users must click the link sent via email. Admin approval is also required to access member features.
- “Forgot password” is limited to once per hour per account (configurable via `PASSWORD_RESET_COOLDOWN_MINUTES`).
- Admins can optionally email an announcement to all approved, verified members by checking the “Email this announcement…” box in the admin UI.

---

## Running Tests

The backend includes a full suite of integration tests to ensure API reliability.

*   **To run all backend tests:**
    ```bash
    # From the backend/ directory
    npm test:integration
    ```
    This includes tests for password reset rate limiting and announcement email notifications (email sending is mocked in tests).
*   **To run a specific test file (e.g., for debugging):**
    ```bash
    # From the backend/ directory
    npm run test:debugging -- test/debugging/users.test.js
    ```

---

## Deployment (Production)

For repeatable deployments to a remote server via SSH (backups, code sync, Docker image build, minimal downtime restarts, and verification), use the helper scripts in `deploy/`:

- `deploy/deploy.local.sh` – run locally; syncs code to the remote and invokes the remote routine.
- `deploy/remote.deploy.sh` – runs on the server; creates backups, builds, restarts, runs migrations (optional), and verifies.
- `deploy/config.example.env` – copy to `deploy/config.env` and set `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_KEY`, `REMOTE_DIR`, `DOMAIN`, and flags like `RUN_MIGRATIONS`.
- `deploy/DEPLOY.md` – full details and quick start.

Environment (production highlights)
- Backend: `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_PROVIDER=sendgrid`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `SENDGRID_API_KEY`, `FRONTEND_BASE_URL`, `PASSWORD_RESET_COOLDOWN_MINUTES`, `TURNSTILE_SECRET_KEY`.
- Frontend build: `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_TURNSTILE_SITE_KEY`.

Nginx
- Example site config lives on the server; ensure HTTPS, redirect `www` → apex, and a strict CSP that allows `https://challenges.cloudflare.com` for Turnstile.
- The app’s Docker Compose publishes backend on `127.0.0.1:3001` and frontend on `127.0.0.1:3000`; Nginx proxies `https://<domain>/api/` to backend and `/` to frontend.

---

## Contributing & Security

- See [CONTRIBUTING](CONTRIBUTING.md) for guidelines.
- Review our [SECURITY](SECURITY.md) policy for responsible disclosure.
- License: [MIT](LICENSE).
