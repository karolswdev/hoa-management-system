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
| **Announcements / HOA Messages** | ✅ Create, Edit, Delete, Optional Email Notify to All Members | ✅ View                                              | ❌                          |
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
    VITE_APP_VERSION=1.0.0
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
- `deploy/config.example.env` – copy to `deploy/config.env` and set `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_KEY`, `REMOTE_DIR`, `DOMAIN`, `BACKEND_IMAGE`, `FRONTEND_IMAGE`, and flags like `RUN_MIGRATIONS`.
- `deploy/DEPLOY.md` – full details and quick start.

Environment (production highlights)
- Backend: `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_PROVIDER=sendgrid`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `SENDGRID_API_KEY`, `FRONTEND_BASE_URL`, `PASSWORD_RESET_COOLDOWN_MINUTES`, `TURNSTILE_SECRET_KEY`.
- Frontend build: `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_TURNSTILE_SITE_KEY`, `VITE_APP_VERSION` (the release workflow injects the git tag).

GitHub Actions Release Workflow
- Publish a GitHub release (or dispatch the workflow manually) to trigger an automated build.
- The workflow builds backend and frontend images with `docker buildx`, tags them as `ghcr.io/<owner>/hoa-backend:<tag>` and `ghcr.io/<owner>/hoa-frontend:<tag>`, and pushes them to GHCR using the built-in `GITHUB_TOKEN`.
- The Linode only runs `docker-compose pull`/`up`, so builds happen entirely inside GitHub Actions (much lighter on the droplet).
- Required repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_DIR`, `DEPLOY_DOMAIN`, `DEPLOY_SSH_KEY`, `VITE_TURNSTILE_SITE_KEY`.

Nginx
- Example site config lives on the server; ensure HTTPS, redirect `www` → apex, and a strict CSP that allows `https://challenges.cloudflare.com` for Turnstile.
- The app’s Docker Compose publishes backend on `127.0.0.1:3001` and frontend on `127.0.0.1:3000`; Nginx proxies `https://<domain>/api/` to backend and `/` to frontend.

---

## HOA Message Feature

### Overview

The HOA Message feature allows administrators to send important communications to all HOA members via email. This is implemented through the announcements system with email notification capabilities.

### How It Works

When creating an announcement, administrators can enable the **"Notify Members"** option to send the announcement via email to all approved, verified, and active HOA members.

**API Endpoint**: `POST /api/announcements`

**Request Body**:
```json
{
  "title": "Important HOA Update",
  "content": "<p>This is an important message for all members.</p>",
  "notify": true,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Notification Behavior**:
- Emails are sent to all users with:
  - `status: 'approved'`
  - `email_verified: true`
  - `is_system_user: false`
- Uses the `announcement.html` email template
- Emails are sent sequentially with error handling
- Failed emails don't prevent announcement creation

### Usage

1. **Admin logs in** to the system
2. **Navigate to Announcements** section
3. **Click "Create Announcement"**
4. **Fill in announcement details**:
   - Title: Subject of the message
   - Content: HTML-formatted message body
   - Expires At: Optional expiration date
   - **Notify Members**: Check this box to send emails
5. **Submit** the announcement

Members will receive an email with the announcement content and a link to view it on the website.

### Implementation Details

**Backend**: `backend/src/services/announcement.service.js` (lines 54-85)

The email sending logic:
- Queries all eligible recipients from the database
- Renders the announcement email template
- Sends individual emails via SendGrid
- Continues on email failures (graceful degradation)

**Email Template**: `backend/src/emails/templates/announcement.html`

### Rate Limiting

Mass email sending is not currently rate-limited, but individual announcement creation follows standard API rate limits (100 requests per 15 minutes per IP).

### Future Enhancements

Potential improvements for a dedicated HOA Message feature:
- Recipient targeting (specific user groups, roles)
- Message scheduling
- Delivery tracking and read receipts
- Template management
- Message history and archive
- Background job processing for large recipient lists

---

## Production Readiness

The HOA Management System includes comprehensive production-ready features for monitoring, security, and operations.

### Security Features

- **Rate Limiting**:
  - Global API rate limiting (100 req/15min)
  - Login attempts: 5 per IP+email per 15 minutes
  - Registration: 3 per IP per hour
  - Password reset: 3 per IP+email per hour
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Joi validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries via Sequelize
- **XSS Protection**: DOMPurify content sanitization
- **JWT Authentication**: Secure token-based auth
- **CAPTCHA**: Cloudflare Turnstile on registration
- **Audit Logging**: All admin actions logged

### Monitoring & Observability

#### Prometheus Metrics
- HTTP request rates and durations
- Error rates by endpoint
- Authentication attempts
- Email sending metrics
- System resources (CPU, memory)
- Database query performance

**Endpoint**: `GET /api/metrics`

#### Grafana Dashboards
- Real-time performance visualization
- Response time percentiles (p50, p90, p95, p99)
- Error tracking
- Business metrics

**Access**: `http://your-server:3002` (default: admin/admin)

#### Structured Logging
- Winston logger with JSON format
- Daily log rotation
- Separate log levels (error, warn, info, http, debug)
- Log files in `backend/logs/`

**Start Monitoring Stack**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

#### Error Tracking (Optional)
- Sentry integration for automatic error reporting
- Stack traces and user context
- Performance monitoring
- Configure via `SENTRY_DSN` environment variable

**Documentation**: See [docs/MONITORING.md](docs/MONITORING.md)

### Backup & Recovery

#### Automated Backups

Comprehensive backup script (`scripts/backup.sh`) that backs up:
- Database (SQLite, compressed)
- Uploaded documents
- Application logs
- Git commit information
- Configuration (secrets redacted)

**Setup Automated Backups**:
```bash
# Test the backup script
./scripts/backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/hoa-management-system/scripts/backup.sh
```

**Configuration**:
- `BACKUP_DIR`: Backup location (default: `/root/hoa-backups`)
- `BACKUP_RETENTION_DAYS`: Keep backups for N days (default: 30)
- `BACKUP_NOTIFICATION_EMAIL`: Optional email notifications

#### Restore Procedures

Interactive restore script (`scripts/restore.sh`):
```bash
# Interactive mode
./scripts/restore.sh

# Restore specific backup
./scripts/restore.sh 20250111_020000
```

**Documentation**: See [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md)

### Incident Response

Comprehensive runbook for handling common incidents:
- Application downtime
- Database issues
- Performance degradation
- Security incidents
- Email service failures
- Disk space issues

**Documentation**: See [docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md)

### Testing

#### Frontend Unit Tests
```bash
cd frontend
npm test                # Run tests
npm run test:coverage   # Generate coverage report
npm run test:ui         # Open Vitest UI
```

Framework: Vitest + React Testing Library

#### End-to-End Tests
```bash
cd frontend
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Open Playwright UI
npm run test:e2e:debug  # Debug mode
```

Framework: Playwright

#### Backend Integration Tests
```bash
cd backend
npm run test:integration
npm run test:debugging
```

Framework: Jest + Supertest

### Environment Variables

#### Required Production Variables
```bash
# Security
JWT_SECRET=your-secret-here
ALLOWED_ORIGINS=https://yourdomain.com

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=no-reply@yourdomain.com
EMAIL_FROM_NAME=Your HOA Name
FRONTEND_BASE_URL=https://yourdomain.com

# Turnstile CAPTCHA
TURNSTILE_SECRET_KEY=your-secret-key
VITE_TURNSTILE_SITE_KEY=your-site-key
VITE_APP_VERSION=1.0.0
```

#### Optional Production Variables
```bash
# Monitoring
SENTRY_DSN=https://your-sentry-dsn
SENTRY_TRACES_SAMPLE_RATE=0.1
APP_VERSION=1.0.0

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
LOGS_DIR=./logs

# Backup
BACKUP_DIR=/root/hoa-backups
BACKUP_RETENTION_DAYS=30
BACKUP_NOTIFICATION_EMAIL=admin@yourdomain.com

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
```

See `.env.example` for complete list.

---

## Contributing & Security

- See [CONTRIBUTING](CONTRIBUTING.md) for guidelines.
- Review our [SECURITY](SECURITY.md) policy for responsible disclosure.
- License: [MIT](LICENSE).

---

## Infrastructure

See docs/INFRASTRUCTURE.md for:
- Cloud/OS details, domains, and TLS
- Nginx proxying (ports, logs, CSP)
- Docker/Compose service layout and persistence paths
- Health endpoints and backup locations
