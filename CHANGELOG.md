# Changelog

All notable changes to the HOA Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-01-11

### Added - Production Readiness Improvements

#### Democracy Module
- **Poll Management** (`POST /api/polls`, `GET /api/polls`, `GET /api/polls/{id}`):
  - Admin-only poll creation with support for informal, binding, and straw-poll types
  - Public/member access to view active, scheduled, and closed polls
  - Detailed poll information with options, status, and metadata
  - Feature flag gating: `polls.binding-enabled` controls binding poll creation
  - Poll status calculated server-side (scheduled, active, closed)
  - HTML sanitization on poll title and description
  - Optional member notifications via email on poll creation
  - Feature flag `polls.notify-members-enabled` gates notification functionality
- **Voting with Hash Chain Integrity** (`POST /api/polls/{id}/votes`):
  - Member-only vote submission with cryptographic receipt generation
  - Hash chain formula: `SHA256(user_id + option_id + timestamp + prev_hash)`
  - Transaction safety using `BEGIN IMMEDIATE` with row-level locking
  - Duplicate vote prevention (for non-anonymous polls)
  - Vote validation: poll must be active, option must belong to poll
  - Returns receipt code and integrity metadata (vote_hash, prev_hash)
  - Audit logging with correlation IDs for all vote submissions
  - Support for anonymous and identified voting modes
- **Receipt Verification** (`GET /api/polls/receipts/{code}`):
  - Public endpoint for verifying vote receipts
  - Constant-time response to prevent timing attacks
  - Privacy-preserving: returns poll/option info without voter identity
  - Receipt code format: 16+ character alphanumeric string
  - Verification status returned (valid/invalid)
- **Poll Results** (`GET /api/polls/{id}/results`):
  - Public access for closed polls, admin-only for active polls
  - Aggregated vote counts by option
  - Privacy protection: no individual voter identities exposed
  - Results sorted by option order_index
- **Hash Chain Integrity Verification** (`GET /api/polls/{id}/integrity`):
  - Admin-only endpoint for post-poll audit verification
  - Validates entire hash chain for poll
  - Recalculates vote hashes and verifies chain links
  - Returns validation report with discrepancies if any
  - Compliance and tamper detection support
- **Email Notifications**:
  - Optional member notifications on poll creation
  - Controlled by `polls.notify-members-enabled` feature flag
  - Creates EmailAudit and ResidentNotificationLog records
  - SendGrid integration for email delivery
  - Correlation IDs for tracking notification delivery
- **Feature Flags**:
  - `polls.binding-enabled`: Allows creation of binding vote type (60s cache TTL)
  - `polls.notify-members-enabled`: Enables email notifications for polls (60s cache TTL)
  - Flag values checked per-request to enforce feature availability
- **OpenAPI Documentation** (`api/openapi.yaml`):
  - Complete REST API specification for all democracy endpoints
  - Request/response schemas for polls, votes, receipts, and results
  - Examples for informal and binding poll workflows
  - Security requirements (JWT, member/admin roles)
  - Error response documentation (400, 401, 403, 404, 409, 500)
  - Feature flag behavior and hash chain mechanics documented
  - Rate limiting headers included in responses
  - Cross-references to hash chain diagrams (`docs/diagrams/democracy-sequence.puml`)

#### Board Governance Module
- **Board Roster Endpoint** (`GET /api/board`):
  - Public/member access to current board roster based on `board.visibility` feature flag
  - Returns current members with nested user and title information
  - Sorted by board title rank (ascending)
  - Optional authentication support via JWT
- **Board History Endpoint** (`GET /api/board/history`):
  - Members-only access to historical board composition
  - Controlled by `board.history-visibility` feature flag
  - Returns past members with start/end dates
  - Returns 403 for unauthorized guests when in members-only mode
- **Board Contact Form** (`POST /api/board/contact`):
  - Public contact submission to current board members
  - Cloudflare Turnstile CAPTCHA validation required
  - Rate limiting: 3 requests per hour per IP and per email (returns 429 when exceeded)
  - HTML sanitization on subject and message fields
  - Email routing to all current board members via SendGrid
  - Status tracking: pending → sent/failed with audit trail
  - Error responses: 502 for SendGrid failures, 503 when no board members available
- **Admin Board Title Management**:
  - `GET /api/board/titles`: Public endpoint to list all board titles
  - `POST /api/board/titles`: Admin-only title creation with uniqueness validation
  - `PUT /api/board/titles/:id`: Admin-only title updates (name and rank)
  - `DELETE /api/board/titles/:id`: Admin-only deletion with constraint checking (409 if members assigned)
- **Admin Board Member Management**:
  - `POST /api/board/members`: Admin-only member assignment with active position validation
  - `PUT /api/board/members/:id`: Admin-only updates supporting partial changes (title, dates, bio)
  - `DELETE /api/board/members/:id`: Admin-only permanent deletion for data correction
- **Feature Flags for Board Governance**:
  - `board.visibility`: Controls public roster exposure (`public` or `members-only`)
  - `board.history-visibility`: Controls history access (`public` or `members-only`)
  - 60-second cache TTL on flag reads for performance
  - Flag values checked per-request to enforce visibility policies
- **OpenAPI Documentation** (`api/openapi.yaml`):
  - Comprehensive REST API specification for all board endpoints
  - Request/response schemas matching controller DTOs exactly
  - Security schemes (JWT Bearer auth with optional auth support)
  - Error response documentation (400, 401, 403, 404, 409, 429, 502, 503, 500)
  - CAPTCHA requirements and rate limit behavior documented
  - Feature flag metadata and visibility policy explanations
  - Example requests and responses for all endpoints
  - Rate limiting headers and Retry-After guidance

#### Security Enhancements
- **Global Rate Limiting**: Added express-rate-limit for all API endpoints (100 req/15min default)
- **Authentication Rate Limiting**:
  - Login: 5 attempts per IP+email per 15 minutes
  - Registration: 3 attempts per IP per hour
  - Password Reset: 3 attempts per IP+email per hour
- **CORS Security**: Restricted to configured origins (configurable via `ALLOWED_ORIGINS` env var)
- **Enhanced Error Handling**: Sanitized error messages in production to prevent information leakage

#### Monitoring & Observability
- **Winston Structured Logging**:
  - JSON format logs in production
  - Daily log rotation (14 days for combined, 7 days for HTTP)
  - Separate log levels: error, warn, info, http, debug
  - Log files: `backend/logs/combined-*.log`, `backend/logs/error-*.log`, `backend/logs/http-*.log`
- **Prometheus Metrics**:
  - HTTP request metrics (rate, duration, status codes)
  - Business metrics (auth attempts, email sending, user registrations)
  - System metrics (memory, CPU usage)
  - Database query performance
  - Custom metrics endpoint: `/api/metrics`
- **Grafana Dashboards**:
  - Overview dashboard with key performance indicators
  - Real-time metrics visualization
  - Response time percentiles (p50, p90, p95, p99)
  - Error rate tracking
  - Authentication and email metrics
- **Prometheus Alerting**:
  - High error rate alerts (warning & critical)
  - High response time alerts
  - API endpoint down alerts
  - High memory/CPU usage alerts
  - Disk space alerts
  - High authentication failure alerts
  - Email sending failure alerts
- **Sentry Integration** (optional):
  - Automatic error tracking and reporting
  - Performance monitoring
  - Release tracking
  - Configurable via `SENTRY_DSN` environment variable

#### Testing Infrastructure
- **Frontend Unit Testing**:
  - Vitest test runner
  - React Testing Library
  - Test utilities and helpers
  - Example tests for components
  - Coverage reporting support
  - Commands: `npm test`, `npm run test:coverage`, `npm run test:ui`
- **End-to-End Testing**:
  - Playwright E2E test framework
  - Tests for critical user flows (login, announcements)
  - Multi-browser support (Chromium, Firefox, WebKit)
  - Mobile viewport testing
  - Commands: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:debug`
  - Configuration: `frontend/playwright.config.ts`

#### Backup & Recovery
- **Automated Backup Script** (`scripts/backup.sh`):
  - Backs up database, uploads, logs, and code state
  - Gzip compression for space efficiency
  - Configurable retention period (default: 30 days)
  - Automatic cleanup of old backups
  - Support for email notifications
  - Cron-ready for scheduled backups
- **Restore Script** (`scripts/restore.sh`):
  - Interactive restore process
  - Safety backups before restore
  - Supports restoring specific backup by timestamp
  - Verification steps

#### Documentation
- **Monitoring Guide** (`docs/MONITORING.md`):
  - Complete guide to monitoring stack setup
  - Dashboard access instructions
  - Key metrics explanation
  - Alert configuration
  - Log management
  - Troubleshooting procedures
- **Incident Response Runbook** (`docs/INCIDENT_RESPONSE.md`):
  - Step-by-step incident response procedures
  - Common incident scenarios with resolutions
  - Application down, database issues, performance degradation
  - Security incidents handling
  - Post-incident review template
  - Emergency contacts and quick reference
- **Backup & Restore Guide** (`docs/BACKUP_AND_RESTORE.md`):
  - Comprehensive backup strategy documentation
  - Automated and manual backup procedures
  - Disaster recovery plans
  - Backup testing procedures
  - Best practices and 3-2-1 rule
  - Quick reference commands

#### Configuration
- **New Environment Variables**:
  ```bash
  # CORS Configuration
  ALLOWED_ORIGINS=https://sandersoncreekhoa.com,https://www.sandersoncreekhoa.com

  # Logging
  LOG_LEVEL=info
  LOGS_DIR=./logs
  ENABLE_FILE_LOGGING=true

  # Monitoring - Sentry (optional)
  SENTRY_DSN=
  SENTRY_TRACES_SAMPLE_RATE=0.1
  SENTRY_PROFILES_SAMPLE_RATE=0.1
  SENTRY_ENABLED_IN_DEV=false
  APP_VERSION=1.0.0

  # Grafana
  GRAFANA_ADMIN_USER=admin
  GRAFANA_ADMIN_PASSWORD=admin

  # Backup
  BACKUP_DIR=/root/hoa-backups
  BACKUP_RETENTION_DAYS=30
  BACKUP_NOTIFICATION_EMAIL=admin@example.com
  ```

### Changed

#### Backend
- **Error Handling**: Enhanced global error handler with structured logging and Sentry integration
- **Middleware Stack**: Added logging middleware to track all HTTP requests and responses
- **App Initialization**: Added startup logging with environment and endpoint information
- **Console Logging**: Replaced console.log/error with Winston structured logging throughout

#### Frontend
- **Package Configuration**: Added test scripts for Vitest and Playwright

#### Docker
- **Monitoring Stack**: New `docker-compose.monitoring.yml` for Prometheus, Grafana, and Node Exporter
- **Network Configuration**: Monitoring services connected to application network

### Dependencies

#### Backend - New Dependencies
- `@sentry/node@^8.47.0` - Error tracking
- `@sentry/profiling-node@^8.47.0` - Performance profiling
- `express-rate-limit@^7.5.0` - Rate limiting middleware
- `prom-client@^15.1.3` - Prometheus metrics client
- `winston@^3.18.0` - Structured logging
- `winston-daily-rotate-file@^5.0.0` - Log rotation

#### Frontend - New Dev Dependencies
- `@playwright/test@^1.49.1` - E2E testing framework
- `@testing-library/jest-dom@^6.6.3` - Jest DOM matchers
- `@testing-library/react@^16.1.0` - React testing utilities
- `@testing-library/user-event@^14.5.2` - User event simulation
- `@vitest/ui@^2.1.8` - Vitest UI
- `jsdom@^26.0.0` - DOM implementation for tests
- `vitest@^2.1.8` - Unit test framework

### Security

#### Improvements
- Rate limiting prevents brute force attacks on authentication endpoints
- CORS restricts access to authorized domains only
- Enhanced input validation and sanitization
- Improved error message sanitization in production
- Audit logging for all admin actions

#### Recommendations
- Configure `ALLOWED_ORIGINS` to restrict to your production domain
- Set strong `GRAFANA_ADMIN_PASSWORD` in production
- Configure Sentry DSN for error tracking in production
- Implement regular security audits
- Consider implementing 2FA for admin accounts (future enhancement)

### Performance

#### Improvements
- Structured logging reduces I/O overhead
- Metrics collection is lightweight and asynchronous
- Log rotation prevents disk space issues
- Compressed backups reduce storage requirements

### Operations

#### New Operational Capabilities
- Real-time performance monitoring via Grafana
- Automated backup and recovery procedures
- Comprehensive logging for debugging
- Alert system for proactive issue detection
- Incident response procedures documented

#### Monitoring Endpoints
- Health Check: `GET /api/health`
- Prometheus Metrics: `GET /api/metrics`
- Grafana Dashboard: `http://your-server:3002`
- Prometheus UI: `http://your-server:9090`

### Democracy Module Rollout Instructions

#### Feature Flag Configuration

The democracy module uses feature flags for gradual rollout. Follow this sequence:

1. **Initial Setup** (All flags disabled):
   ```sql
   -- Verify flags exist in Config table
   SELECT key, value FROM Config WHERE key LIKE 'polls.%';
   -- Expected: polls.binding-enabled='false', polls.notify-members-enabled='false'
   ```

2. **Phase 1 - Enable Informal Polls** (Pilot):
   - Keep `polls.binding-enabled='false'`
   - Keep `polls.notify-members-enabled='false'`
   - Create test informal polls via AdminConsole
   - Verify poll list, detail, voting, and receipt flows work
   - Monitor logs for errors and audit events
   - Validate hash chain integrity using `GET /api/polls/{id}/integrity`

3. **Phase 2 - Enable Email Notifications**:
   - Set `polls.notify-members-enabled='true'` in Config table
   - Test notification delivery with a small test poll
   - Verify EmailAudit and ResidentNotificationLog records created
   - Monitor SendGrid delivery metrics
   - Confirm members receive emails with correct poll details

4. **Phase 3 - Enable Binding Polls** (Production):
   - Set `polls.binding-enabled='true'` only after informal polls validated
   - Document governance process for binding vote approval
   - Train administrators on binding vs informal poll creation
   - Establish audit procedures for binding vote verification
   - Consider legal review of binding vote receipts before rollout

5. **Monitoring & Operations**:
   - Review AuditEvent logs for poll creation and vote submissions
   - Periodically validate hash chain integrity for closed polls
   - Monitor vote receipt verification requests for anomalies
   - Track notification delivery rates and failures
   - Set up alerts for voting errors or hash chain discrepancies

#### Documentation References

- **API Specification**: `api/openapi.yaml` (democracy endpoints)
- **Hash Chain Diagram**: `docs/diagrams/democracy-sequence.puml`
- **Feature Flag Guide**: See Config table key documentation
- **Backend Implementation**: `backend/src/services/democracy.service.js`, `backend/src/services/vote.service.js`
- **Frontend Components**: `frontend/src/pages/Polls.tsx`, `frontend/src/pages/PollDetail.tsx`

### Migration Notes

#### For Existing Deployments

1. **Update Dependencies**:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. **Update Environment Variables**:
   - Add new variables from `.env.example` to your `.env` file
   - Configure `ALLOWED_ORIGINS` for your domain
   - Optionally configure Sentry DSN

3. **Create Logs Directory**:
   ```bash
   mkdir -p backend/logs
   chmod 755 backend/logs
   ```

4. **Start Monitoring Stack** (optional but recommended):
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
   ```

5. **Set Up Automated Backups**:
   ```bash
   # Test backup script
   ./scripts/backup.sh

   # Add to crontab
   crontab -e
   # Add: 0 2 * * * /path/to/hoa-management-system/scripts/backup.sh
   ```

6. **Configure Grafana** (if using monitoring stack):
   - Access: http://your-server:3002
   - Login with admin/admin (or your configured password)
   - Change default password
   - Verify dashboard is loading data

7. **Verify Installation**:
   ```bash
   # Check application health
   curl http://localhost:3001/api/health

   # Check metrics endpoint
   curl http://localhost:3001/api/metrics

   # Check logs are being written
   ls -la backend/logs/
   ```

### Known Issues

None at this time.

### Deprecated

None.

### Removed

None.

---

## [1.0.0] - Previous Release

### Initial Release
- User authentication and registration
- Announcement management with email notifications
- Event calendar
- Document management with approval workflow
- Discussion forum
- Admin user management
- Audit logging
- SendGrid email integration
- Cloudflare Turnstile CAPTCHA
- Docker deployment support

---

## How to Use This Changelog

### For Developers
- Review changes before updating your development environment
- Check new dependencies and environment variables
- Run tests after updating

### For System Administrators
- Follow migration notes for production updates
- Review security improvements and update configurations
- Set up monitoring and backup procedures

### For Contributors
- Add your changes to the [Unreleased] section
- Follow the format: Added, Changed, Deprecated, Removed, Fixed, Security
- Include relevant details and references

---

*Last Updated: January 2025*
