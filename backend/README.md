# HOA Community Hub - Backend

Node.js/Express REST API for the HOA Management System.

## Tech Stack

- **Framework:** Express.js
- **Database:** SQLite3 (via Sequelize ORM)
- **Authentication:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Joi
- **Email:** SendGrid (adapter-based)
- **CAPTCHA:** Cloudflare Turnstile verification
- **Logging:** Winston with daily rotation
- **Testing:** Jest + Supertest

## Getting Started

```bash
npm install
npm run db:migrate
npm run db:seed
npm start
```

The API starts at `http://localhost:5000` (or `3001` in some configurations).

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=8h

# Default admin (seeded on first run)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPassword123!

# Email (SendGrid)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=no-reply@your-domain.com
EMAIL_FROM_NAME=HOA Community Hub
SENDGRID_API_KEY=your_sendgrid_api_key

# Frontend URL (for email links)
FRONTEND_BASE_URL=http://localhost:3000

# Password reset cooldown (minutes)
PASSWORD_RESET_COOLDOWN_MINUTES=60

# CAPTCHA (Cloudflare Turnstile)
TURNSTILE_SECRET_KEY=your_turnstile_secret
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run db:migrate` | Run Sequelize migrations |
| `npm run db:migrate:undo:all` | Undo all migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:seed:undo:all` | Undo all seeds |
| `npm run test:integration` | Run integration tests (Jest) |
| `npm run test:watch` | Tests in watch mode |

## Project Structure

```
src/
  app.js              # Express app setup, middleware, route mounting
  controllers/        # Request handlers
  services/           # Business logic layer
  middlewares/        # Auth, validation, rate limiting, error handling
  validators/         # Joi validation schemas
  routes/             # Express route definitions
  emails/             # Email templates (HTML)
  utils/              # Helpers (ApiError, logger, etc.)
models/               # Sequelize model definitions
migrations/           # Database schema migrations
seeders/              # Initial data seeders
config/               # Database configuration
test/
  integration/        # Integration test suites
  services/           # Service-level unit tests
  utils/              # Test helpers (DB setup, seeding)
  seeders/            # Test-specific seed data
```

## API Overview

### Public Endpoints
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password with token
- `GET /api/auth/verify-email/:token` — Verify email
- `GET /api/polls/:id/receipts/:code` — Verify vote receipt (public)
- `GET /api/health` — Health check
- `GET /api/metrics` — Prometheus metrics

### Authenticated Endpoints (Member)
- `GET /api/announcements` — List announcements
- `GET /api/events` — List events
- `GET /api/documents` — List documents
- `GET /api/discussions` — List/create discussions
- `GET /api/polls` — List polls, cast votes
- `GET /api/vendors` — Vendor directory
- `GET /api/board` — Board roster
- `PUT /api/users/profile` — Update own profile

### Admin Endpoints
- `GET /api/admin/users` — List users (supports `limit` and `offset`; `limit=0` returns all)
- `POST /api/admin/announcements` — Create announcement (with optional email notification)
- `POST /api/events` — Create event
- `POST /api/admin/documents` — Upload document
- `POST /api/admin/polls` — Create poll
- `GET /api/admin/vendors` — Manage vendor submissions
- `GET /api/admin/audit` — View audit logs
- `PUT /api/admin/config` — Update site configuration

## Testing

```bash
# Integration tests (runs migrations automatically in test env)
npm run test:integration

# With coverage
npm run test:integration -- --coverage

# Specific test file
npx jest --runInBand test/integration/events.test.js
```

Tests use an in-memory SQLite database. Coverage thresholds enforced in CI: 80% lines/statements/functions, 60% branches.

## Security

- **Rate limiting:** Global (100 req/15min), login (5/15min), registration (3/hr), password reset (3/hr)
- **Input validation:** Joi schemas on all endpoints
- **SQL injection prevention:** Parameterized queries via Sequelize
- **XSS protection:** DOMPurify content sanitization
- **Audit logging:** All admin actions recorded with user, action, and timestamp
- **Vote integrity:** Cryptographic hash chain on poll votes with tamper detection
