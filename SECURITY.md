# Security Policy

## Reporting a Vulnerability

- Please email the maintainers with a brief description and reproduction steps.
- Do not open public issues for sensitive reports. We will acknowledge receipt within 72 hours and coordinate a fix.

## Supported Versions

- Main branch is supported. We will backport critical fixes when feasible.

## Security Architecture

### Authentication & Authorization
- **JWT-based authentication** with configurable expiration (`JWT_EXPIRES_IN`)
- **bcrypt password hashing** with salt rounds
- **Email verification** required before account activation
- **Admin approval** required before member access
- **Role-based access control:** Admin and Member roles with middleware enforcement

### Rate Limiting
- **Global:** 100 requests per 15 minutes per IP
- **Login:** 5 attempts per IP+email per 15 minutes
- **Registration:** 3 attempts per IP per hour
- **Password reset:** 3 attempts per IP+email per hour

### Input Validation & Sanitization
- **Joi schemas** validate all API inputs (request body, query params, path params)
- **DOMPurify** sanitizes HTML content before storage and rendering
- **Parameterized queries** via Sequelize ORM prevent SQL injection
- **CAPTCHA** (Cloudflare Turnstile) protects registration from automated abuse

### Vote Integrity
- **Cryptographic hash chain** ensures vote tamper detection
- **Receipt codes** allow voters to independently verify their vote was recorded
- **Constant-time responses** on receipt lookup prevent timing attacks

### Monitoring
- **Audit logging** records all administrative actions with user, action, and timestamp
- **Structured logging** via Winston with daily rotation
- **Prometheus metrics** for request rates, error rates, and system resources
- **CI secret scanning** checks for leaked credentials on every push

## Secrets & Configuration

- Never commit secrets (`.env`, API keys) to the repo. Use `.env.example` and keep real values in environment variables or secret managers.
- The deployment scripts intentionally exclude `.env` and persisted data from sync.
- CI hygiene checks verify `.env` files are not tracked in git.

## Incident Response

If you suspect a security breach:

1. **Contain:** Rotate affected credentials immediately (JWT_SECRET, API keys)
2. **Investigate:** Review audit logs and server access logs
3. **Notify:** Inform affected users if personal data was exposed
4. **Remediate:** Patch the vulnerability and deploy
5. **Document:** Record the incident timeline and lessons learned

## Dependencies

- `npm audit` runs on every CI build at the `critical` severity level
- Dependabot is enabled for automated dependency update PRs
- CodeQL analysis runs on pushes and pull requests
