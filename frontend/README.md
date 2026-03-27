# HOA Community Hub - Frontend

React + TypeScript single-page application for the HOA Management System.

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI) v5
- **Routing:** React Router v6
- **State Management:** React Context API + React Query (TanStack Query)
- **API Client:** Axios
- **Testing:** Vitest (unit), Playwright (E2E)
- **Accessibility:** WCAG 2.1 AA compliant, axe-core integration

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Environment Variables

Create a `.env` file (see root README for full details):

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Sanderson Creek HOA
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest, watch mode) |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright E2E with interactive UI |
| `npm run generate-screenshots` | Generate User Guide screenshots |

## Project Structure

```
src/
  components/       # Reusable UI components
    admin/           # Admin-specific components (AdminDataTable, etc.)
    common/          # Shared components (FormHelper, etc.)
    Polls/           # Poll and voting components
    Vendors/         # Vendor directory components
  contexts/          # React Context providers
    AuthContext       # Authentication state
    AccessibilityContext  # High-visibility mode, font scaling
    CommunityConfigContext # HOA configuration
  hooks/             # Custom React hooks (usePolls, useVendors, etc.)
  pages/             # Route-level page components
    admin/           # Admin pages (users, events, documents, config, audit)
    auth/            # Login, register, forgot/reset password
    member/          # Member pages (dashboard, events, documents, etc.)
  services/          # API service layer (Axios client)
  types/             # TypeScript type definitions
  test/              # Test setup and utilities
  tests/             # Unit and accessibility test files
e2e/                 # Playwright E2E test specs
```

## Testing

### Unit Tests (Vitest)

```bash
npm test -- --run          # Single run
npm run test:coverage      # With coverage (75% threshold enforced in CI)
```

### E2E Tests (Playwright)

Requires backend running on `:5000` and frontend on `:3000`:

```bash
npm run test:e2e                        # All browsers
npx playwright test --project=chromium  # Chromium only
npm run test:e2e:ui                     # Interactive mode
```

E2E specs cover: login, registration, announcements, events, documents, discussions, polls, vendors, board, profile, admin user management, and accessibility.

### Accessibility Tests

```bash
npm test -- --run src/tests/*.a11y.test.tsx
```

Uses axe-core to validate WCAG 2.1 AA compliance on key pages.

## Key Patterns

- **AdminDataTable** — Reusable table with pagination (rows-per-page: 10/25/50/All), sorting, and row actions. Used across all admin pages.
- **React Query** — Server state management with cache invalidation for vendors, polls, and other API data.
- **Accessibility Context** — Global high-visibility mode toggle that increases font sizes, contrast, and touch targets.
- **Role-based rendering** — Components conditionally render based on `user.role` from AuthContext.
