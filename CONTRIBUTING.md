# Contributing Guide

Thank you for your interest in contributing to the HOA Community Hub!

## How to Contribute

1. Fork the repo and create a feature branch from `main`.
2. Keep changes focused and documented.
3. Open a pull request targeting `main` with a clear description.

## Development Setup

- **Backend:** Node/Express + Sequelize (SQLite). Run `npm ci` then `npm start` from `backend/`.
- **Frontend:** React/TS + Vite + MUI. Run `npm ci` then `npm run dev` from `frontend/`.
- See [README.md](README.md) for environment variables, migrations, and seeds.
- See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for package-specific details.

## Testing Requirements

All PRs must pass the CI pipeline before merging. The pipeline includes:

### Backend
- **Linting:** ESLint
- **Integration tests:** `npm run test:integration` (80% coverage threshold)
- **Hashchain integrity:** Vote hash chain tamper detection tests

### Frontend
- **Linting:** ESLint
- **Unit tests:** `npm test -- --run` via Vitest (75% coverage threshold)
- **Accessibility tests:** axe-core WCAG 2.1 AA validation on key pages
- **E2E tests:** Playwright specs run against Chromium in CI (full browser matrix locally)

### Running Tests Locally

```bash
# Backend
cd backend && npm run test:integration

# Frontend unit tests
cd frontend && npm test -- --run

# Frontend E2E (requires backend + frontend running)
cd frontend && npx playwright test --project=chromium
```

## Accessibility

This project maintains **WCAG 2.1 AA** compliance. When contributing UI changes:

- Use semantic HTML elements and proper ARIA attributes.
- Ensure keyboard navigability (Tab, Enter, Escape).
- Maintain sufficient color contrast (4.5:1 for normal text, 3:1 for large text).
- Support the high-visibility mode (check `useAccessibility()` context).
- Test touch targets are at least 44x44px.
- Run accessibility tests: `npm test -- --run src/tests/*.a11y.test.tsx`

## Code Style

- Keep code simple, readable, and consistent with the current project style.
- Favor small, focused PRs over large, sweeping changes.
- Use TypeScript types — avoid `any` where possible.
- Follow existing naming conventions (camelCase for variables, PascalCase for components).

## Security

- **Never commit secrets** (`.env`, API keys, credentials). Use `.env.example` placeholders.
- All user input must be validated (Joi on backend, form validation on frontend).
- Use parameterized queries (Sequelize handles this) — never concatenate SQL.
- Sanitize HTML content with DOMPurify before rendering.
- Report vulnerabilities privately (see [SECURITY.md](SECURITY.md)).

## Project Structure

```
backend/    # Express API, Sequelize models, migrations
frontend/   # React SPA, Playwright E2E tests
docs/       # User guides, runbooks, design documents
deploy/     # Deployment scripts and configuration
```

## CI/CD Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR:

| Job | What it checks |
|-----|---------------|
| Backend Lint | ESLint |
| Backend Tests | Integration tests + coverage |
| Backend Hashchain | Vote integrity tests |
| Frontend Lint | ESLint |
| Frontend Tests | Unit tests + coverage |
| Frontend Accessibility | WCAG 2.1 AA tests |
| E2E Tests | Playwright against running app |
| Security Audits | `npm audit` for both packages |
| Hygiene | No tracked `.env` files, no secrets in code |

All jobs must pass before the aggregate check succeeds.
