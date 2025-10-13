# Phased Plan: Transactional Email Integration

This plan adds production-grade transactional emails to the HOA app for registrations, confirmations, password resets, and optional admin/member notifications. It mixes human-in-the-loop steps (provider setup) with code changes you can stage and roll out safely.

## Outcomes
- Send emails for: password reset, email verification/confirmation, account approval/rejection (optional), and admin alerts (optional).
- Provider-agnostic service with a pluggable adapter (SendGrid recommended first, others documented).
- HTML templates, environment configuration, and deployment notes.

---

## Phase 0 — Choose Provider (Decision)
Pick one primary provider; you can swap later via the adapter.
- Recommended default: SendGrid (reliable, generous free tier; 100 emails/day historically).
- Good alternatives: Resend (simple API), AWS SES (low-cost, needs domain + IAM), Mailgun (trial), Postmark (great deliverability, smaller free tier).
- Criteria: free tier, domain auth (SPF/DKIM), API keys, webhooks, sandbox/testing modes.

Record decision as env vars: `EMAIL_PROVIDER=sendgrid` (or `resend`, `ses`).

---

## Phase 1 — Provider Account Setup (Manual)
Do these steps with your chosen provider’s dashboard.
1. Create account and log in.
2. Verify sender identity:
   - Either “Single Sender” (fast) or “Domain Authentication” (preferred for deliverability).
3. Domain authentication (recommended):
   - Add SPF + DKIM DNS records as instructed by the provider (TXT/CNAME).
   - Optional: DMARC TXT record (p=none initially; monitor via rua/ruf addresses).
4. API key:
   - Create an API key with “Mail Send” scope only.
   - Copy and store securely (password manager, not in git).
5. Configure tracking:
   - Disable click/open tracking for purely transactional mail unless you need it.
6. Test mode/sandbox:
   - If available (e.g., SendGrid sandbox), enable for initial tests.

Deliverables from this phase:
- `SENDGRID_API_KEY` (or provider-specific key)
- Verified `EMAIL_FROM` (e.g., no-reply@your-domain.com)
- Domain authenticated (SPF/DKIM green)

---

## Phase 2 — App Configuration (Env + Settings)
Add these to your environment (local `.env`, prod secrets store):
- Core
  - `EMAIL_PROVIDER=sendgrid`
  - `EMAIL_FROM=no-reply@your-domain.com`
  - `EMAIL_FROM_NAME=HOA Community Hub`
  - `EMAIL_REPLY_TO=info@your-domain.com` (optional)
  - `FRONTEND_BASE_URL=https://your-frontend-domain` (used for links)
- Provider-specific
  - SendGrid: `SENDGRID_API_KEY=...`
  - Resend: `RESEND_API_KEY=...`
  - SES: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

Deployment notes:
- Do not commit secrets. Use `deploy/production.env` (already ignored) or your secret manager.
- In Docker Compose prod, pass the needed vars to the backend container.

---

## Phase 3 — Backend Email Abstraction
Create a provider-agnostic email service.
- File: `backend/src/services/email.service.js`
- Responsibilities:
  - Expose `sendMail({ to, subject, html, text, category, templateId, variables })`.
  - Select provider based on `EMAIL_PROVIDER`.
  - Dev-safe behavior: if no API key, log email payload instead of sending.
  - Basic retry (e.g., up to 2 retries on 5xx).

Provider adapters (pick one to implement now):
- `backend/src/services/providers/sendgrid.provider.js`
- Optionally add `resend.provider.js`, `ses.provider.js` later.

---

## Phase 4 — Email Templates
Add minimal, branded HTML templates.
- Directory: `backend/src/emails/templates/`
- Templates to create:
  - `password-reset.html`
  - `email-verification.html`
  - `account-approved.html` (optional)
  - `account-rejected.html` (optional)
- Keep inline styles simple or use a tiny CSS-in-HTML snippet.
- Add a utility to inject variables (e.g., `{{name}}`, `{{action_link}}`).

---

## Phase 5 — Hook Into Auth Flows
Integrate sending where the code already generates/logs email content.

1) Password Reset (already implemented with token + console log)
- Replace the log in `requestPasswordReset` with `emailService.sendMail(...)`.
- Link: `${FRONTEND_BASE_URL}/reset-password?token=<plain_token>`.
- Keep the existing token storage and expiry.

2) Email Verification (new, uses existing VerificationToken model)
- Generate a new `email_verification` token on registration.
- Send verification email with link: `${FRONTEND_BASE_URL}/verify-email?token=<plain_token>`.
- Add backend endpoint `GET /api/auth/verify-email?token=` that:
  - Validates token (type `email_verification`, not expired).
  - Sets `user.email_verified = true` and deletes the token.
  - Returns a simple success JSON the frontend can interpret.
- Update login policy (optional): block login if `email_verified` is false and show a message.

3) Account Approval/Rejection (optional)
- When an admin updates status to `approved` or `rejected`, send a notification email.
- Location: user admin controller/service where status changes occur.

---

## Phase 6 — Frontend UX
- Add a `VerifyEmailResultPage` that reads the `token` from querystring and calls `/api/auth/verify-email` to show success/failure.
- Update copy and flows:
  - Registration success screen: “Check your email to verify your account.”
  - Login: If blocked due to unverified email, show CTA to resend verification (bonus endpoint).
- Optional: Add a “Resend Verification Email” button calling `/api/auth/resend-verification`.

---

## Phase 7 — Testing Strategy
- Unit tests (backend):
  - Mock provider adapter; assert `email.service` receives correct payloads.
  - Auth service tests for password reset and email verification flows.
- Integration tests:
  - Use provider sandbox mode or a mock transport that writes to a temp file.
- Manual tests:
  - Use a real mailbox (e.g., a test alias) to validate deliverability, links, and spam score.

---

## Phase 8 — Deployment & Ops
- Add env vars to `deploy/docker-compose.prod.yml` and `deploy/production.env`.
- Verify outbound network access from the backend container to provider API.
- Warm-up: send a few real messages to build reputation.
- Monitor provider dashboard for bounces/blocks.

---

## Phase 9 — Webhooks (Optional, Recommended)
Handle bounces/complaints/spam reports to keep lists healthy.
- Add route: `POST /api/webhooks/email` (provider-specific path/verification).
- Store events (table: `email_events`), or log initially.
- On hard bounce/complaint: flag the user email to prevent future sends and notify admin.

---

## Phase 10 — Future Enhancements
- Queue + background jobs (BullMQ + Redis) for reliable delivery and rate limiting.
- Template engine (MJML -> HTML build step) and localization.
- Digest emails (daily/weekly summaries).
- Link instrumentation via your domain to maintain brand and deliverability.

---

## Implementation Cheatsheet

Backend packages (pick provider):
- SendGrid: `npm i @sendgrid/mail`
- Resend: `npm i resend`
- AWS SES: `npm i @aws-sdk/client-ses`

Env (examples):
```
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=no-reply@your-domain.com
EMAIL_FROM_NAME=HOA Community Hub
FRONTEND_BASE_URL=http://localhost:3000
SENDGRID_API_KEY=your-sendgrid-key
```

Minimal SendGrid adapter (sketch):
```js
// backend/src/services/providers/sendgrid.provider.js
const sg = require('@sendgrid/mail');

function init(apiKey) {
  sg.setApiKey(apiKey);
}

async function send({ to, subject, html, text }) {
  await sg.send({
    to,
    from: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || 'HOA' },
    subject,
    html,
    text,
  });
}

module.exports = { init, send };
```

Email service skeleton:
```js
// backend/src/services/email.service.js
const providerName = process.env.EMAIL_PROVIDER || 'log';

let provider = null;
if (providerName === 'sendgrid') {
  provider = require('./providers/sendgrid.provider');
  provider.init(process.env.SENDGRID_API_KEY);
}

async function sendMail(payload) {
  if (!provider) {
    console.log('[email:log-only]', JSON.stringify(payload, null, 2));
    return;
  }
  return provider.send(payload);
}

module.exports = { sendMail };
```

Hook in password reset (where it currently console.logs):
```js
// inside requestPasswordReset
await emailService.sendMail({
  to: user.email,
  subject: 'Password Reset Request',
  html: renderTemplate('password-reset.html', { name: user.name, action_link: resetLink }),
  text: `Reset your password: ${resetLink}`,
});
```

---

## Alternate Providers Quick Start

Resend
- Create API key, verify domain or sender.
- Env: `RESEND_API_KEY`, `EMAIL_FROM`.
- Package: `npm i resend`
- Usage:
```js
const { Resend } = require('resend');
const client = new Resend(process.env.RESEND_API_KEY);
await client.emails.send({ from: process.env.EMAIL_FROM, to, subject, html });
```

AWS SES
- Verify domain/sender, set IAM user with SES.
- Env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.
- Package: `npm i @aws-sdk/client-ses`
- Usage:
```js
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const ses = new SESClient({ region: process.env.AWS_REGION });
await ses.send(new SendEmailCommand({
  Source: process.env.EMAIL_FROM,
  Destination: { ToAddresses: [to] },
  Message: { Subject: { Data: subject }, Body: { Html: { Data: html }, Text: { Data: text } } },
}));
```

---

## Rollout Plan
1. Implement email service + provider adapter.
2. Replace password-reset console log with real send (dev log-only until keys present).
3. Add email verification flow (backend + simple frontend page).
4. Wire optional admin notifications on approval/rejection.
5. Add env to prod and deploy.
6. Validate deliverability with 3–5 real inboxes; monitor bounces.

This phased plan keeps risk low while delivering immediate value (password reset emails), then layering verification and notifications once the plumbing is solid.

