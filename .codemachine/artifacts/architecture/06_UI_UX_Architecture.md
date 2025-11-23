<!-- anchor: 0-0-ui-ux-architecture -->
# UI/UX Architecture: HOA Management System
**Status:** UI_REQUIRED

<!-- anchor: 1-0-design-system-specification -->
## 1. Design System Specification
The HOA Management System extends an established React + MUI experience, so the refreshed design system must keep the familiar tone of a volunteer-run community portal while layering in High Visibility (High Vis) adaptations. Tokens feed directly into `createAppTheme(mode)` so that the front-end can flip between standard and high-vis palettes without component rewrites. Each subsection below maps tokens to accessibility goals and outlines how the Accessibility Suite toggles reuse the same definitions.

<!-- anchor: 1-1-color-palette -->
### 1.1. Color Palette
- **Primary Deep Navy (#003366):** Serves as the default brand anchor for headers, nav bars, CTAs, and large form actions; conforms to WCAG contrast ratios when paired with white or light neutral backgrounds.
  High Vis mode keeps the hue but increases saturation and ensures solid outlines to prevent haloing on older LCD monitors.
- **Primary Onyx (#000000):** Reserved for High Vis buttons, icon strokes, and typography to guarantee maximum contrast; only used sparingly in standard mode for small icons.
  Avoid using Onyx as a background to reduce visual fatigue.
- **Secondary Sage (#4F6B5A):** Soft supportive hue for cards, filter chips, and vendor badges; doubles as hover color for secondary actions.
  High Vis overrides lighten this to #2E472F while thickening borders to maintain clarity.
- **Accent Sunlit Amber (#FFB347):** Draws attention to status banners, poll closing warnings, and unread board messages; use with 16px padding minimum to avoid color bleeding.
  In High Vis, the amber is toned to #E6912B to reduce glare while keeping contrast.
- **Neutral Cloud (#F5F7FA):** Default dashboard background; ensures enough separation from white cards while remaining easy on the eyes.
  High Vis upgrades switch to pure white (#FFFFFF) for maximum contrast.
- **Neutral Granite (#4A4A4A):** Base text color in standard mode, especially for body copy and table content; interacts well with accent lines.
  All underlines use 1px Granite to maintain consistent visual rhythm.
- **Success Pine (#1E7344):** Communicates successful submissions, e.g., vote receipts displayed as chips; lighten to #34A853 for better readability on mobile.
  Always pair with white or off-white backgrounds for clarity.
- **Warning Harvest (#E37400):** Alerts for approaching deadlines and upcoming board renewals; ensure bold typography and iconography accompany the color to satisfy color-blind accessibility.
- **Error Brick (#B3261E):** Use for destructive actions, invalid inputs, and captcha failures.
  Provide multi-modal cues (shake animations turned off by default but available via reduced-motion detection).
- **Info Azure (#1D8CD8):** Secondary informative color for tooltips, contextual help, and inline guidance; lighten to #4FB3FF for background fills.
- **High Vis Outlines (#1A1A1A at 2px):** Dedicated stroke color ensuring components remain visually separated when fonts scale up by 25%; used in focus states, modals, and cards.
- **Gradient for Hero Blocks:** A subtle linear gradient (#003366 → #4F6B5A) used on hero banners to add depth without animation; disabled in High Vis to minimize distractions.
- **Shadow Color (#000000 / 15% opacity):** Applied to modals and floating buttons; in High Vis, convert to solid outlines rather than dropshadows to avoid blur.
- **State Overlay (#FFFFFF / 90% opacity):** Creates frosted overlays for disabled components and skeleton loaders; tinted to #FFFFE0 in High Vis to avoid full white stacking.

<!-- anchor: 1-2-typography -->
### 1.2. Typography
- **Font Family:** Inter remains the baseline due to its legibility and broad availability; fallback stack `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif` ensures consistent rendering in low-resource devices.
- **Type Scale:**
  - `xs / 12px`: Captions, badge labels, vendor tags; automatically increases to 14px in High Vis.
  - `sm / 14px`: Helper text, footers, metadata.
  - `base / 16px`: Default body copy, table text, button labels.
  - `lg / 20px`: Section headers, card titles.
  - `xl / 24px`: Hero copy, poll names, board roster headings.
  - `2xl / 32px`: Landing hero and accessibility alerts.
  - `3xl / 40px`: Rare, used on marketing hero or release highlights.
  - `4xl / 48px`: Reserved for major campaign banners, seldom surfaced on internal pages.
- **Font Weights:** 400 Normal for body, 500 Medium for interactive labels, 600 Semi-bold for headings; avoid 700 except for short call-outs because heavier weights reduce readability at larger sizes.
- **Line Heights:** 1.5 for body text to maximize readability, 1.2 for headings, 1.75 for paragraphs inside modals to counter limited width, 2.0 for bullet lists when fonts enlarge.
- **High Vis Scaling:** `AccessibilityContext` multiplies base font size by 1.22; component-specific overrides clamp max size to avoid layout overflows and wrap text onto multiple lines to preserve single-column readability.
- **Typography Utilities:** `Text` atom receives props for `variant`, `tone`, `truncate`, and `emphasis`; integrates with `srOnly` prop to deliver screen-reader only instructions, particularly for high-contrast toggles.
- **Number Formatting:** For vote counts and board term dates, use tabular numbers at 0.08em letter spacing to align digits vertically; maintain `aria-live="polite"` on dynamic numbers so screen readers announce updates gracefully.
- **Accessibility Notes:** All uppercase text must include `letter-spacing: 0.08em`; avoid italicized fonts since some residents reported motion sickness when fonts lean.
- **Localization Considerations:** Even though English-only is assumed, keep sentences short, use plain language, and rely on icons plus text to meet comprehension needs.

<!-- anchor: 1-3-spacing-sizing -->
### 1.3. Spacing & Sizing
- **Base Unit (4px):** Every spacing multiple follows 4px increments; containers use 24px padding on desktop, 16px on tablet, and 12px on mobile.
- **Grid:** 12-column grid on desktop with 32px gutters; collapses to 8-column grid on tablets and a single-column stack on mobile when width < 600px.
- **Section Rhythm:** Top-level sections maintain 64px vertical spacing; cards inside maintain 24px to create nested rhythm that still feels calm.
- **Interactive Targets:** Buttons, toggles, icons all respect a 44px minimum hit area; Accessibility toggle grows to 52px square in High Vis for easier tapping.
- **Form Fields:** Default height 48px with 12px padding; when High Vis active, height becomes 56px and label spacing increases to 8px to prevent overlapping text.
- **Modal Sizing:** Small modals max-width 480px, medium 640px, large 880px; all modals are full-width minus 32px margin on mobile to avoid pinch-zoom.
- **List Density:** Tables and lists use 16px row padding and optional condensed mode at 12px for admin grids; either way, maintain 8px row separators to keep scanning easy.
- **Iconography:** Standard icon size 24px; enlarge to 28px inside navigation and 32px for High Vis or when used as callouts in helper tooltips.
- **Layout Containers:** `PageFrame` component enforces max content width of 1160px; `SplitPane` uses CSS grid to create two-column views with 60/40 split on desktop and stack on mobile.
- **Motion Considerations:** Animations use 200ms ease-in-out transitions; `prefers-reduced-motion` respects OS settings and short-circuits transitions to avoid vestibular discomfort.

<!-- anchor: 1-4-component-tokens -->
### 1.4. Component Tokens
- **Border Radius:** Core radius 8px for cards, modals, and inputs; `Pill` tokens for chips use 999px radius; `High Vis` toggles rely on 4px radius to create crisper edges.
- **Shadow & Elevation:** `elevation-sm` uses 0px 1px 2px with 15% opacity for cards; `elevation-md` uses 0px 4px 12px; `High Vis` converts elevations to double border outlines (#000000 and #FFFFFF) to maintain depth cues without blur.
- **Focus Rings:** Use 2px `Info Azure` outlines on light backgrounds and `#FFFFFF` outlines on dark backgrounds; focus indicator offset 2px to avoid overlapping borders.
- **Button Tokens:**
  - `primary`: navy background, white text, 16px vertical padding, 24px horizontal, 2px border in High Vis.
  - `secondary`: outline style with Granite text, 1px border, fill on hover.
  - `danger`: Brick fill, 3px border, uppercase text reserved for destructive actions.
- **Surface Tokens:** `surface-card`, `surface-panel`, `surface-modal`, `surface-banner`; each includes background, border, and typography pairings defined in theme module.
- **Transition Tokens:** Standard `easeInOutCubic` for nav transitions, `easeOutBack` for success confirmations; no more than 250ms to keep interface snappy.
- **Input Tokens:** Floating labels rely on 12px top offsets, 1px border by default, 2px in High Vis; error states add 1px red outline plus icon.
- **Skeleton Loaders:** `SkeletonBlock` uses 8px radius and `#E0E6ED` shimmer; High Vis uses alternating stripes (12px height) without animation to avoid flicker.
- **Tooltips & Helper Popovers:** `FormHelper` uses `Info Azure` background, 1px Onyx border in High Vis, 12px radius, 8px caret offset to align with target.
- **Charts and Data Viz:** Poll result bars adopt palette tokens with 2px Onyx outlines in High Vis, pattern overlays for color-blind clarity, and data labels anchored at the end of bars.
- **Feature Flag Badges:** Colors follow `success`, `warning`, `error`, `neutral` tokens to convey rollout state; badges include `aria-live` updates when a flag changes from admin console.

<!-- anchor: 2-0-component-architecture -->
## 2. Component Architecture
The interface follows Atomic Design principles layered over React components, enforcing consistent prop contracts and accessibility patterns. Components sit inside `/components` grouped by domain (Board, Polls, Vendors, Accessibility) while shared atoms live under `/components/common`. React Query handles data fetching; contexts manage high-level states (auth, accessibility, feature flags). The architecture below details how each class of component works together.

<!-- anchor: 2-1-overview -->
### 2.1. Overview
- **Atomic Design Stack:** Atoms (buttons, chips, typography), Molecules (form rows, status banners), Organisms (board roster list, poll ballot), Templates (page frames), and Pages (`Board.tsx`, `PollDetail.tsx`, etc.).
- **Feature Flag Awareness:** Templates read config data before rendering; e.g., `BoardPage` checks `board.visibility` to decide whether to show roster to guests or prompt login.
- **Data Fetch Strategy:** Each template registers React Query hooks with `staleTime` tuned per endpoint (e.g., board roster caches for 5 minutes, polls for 30 seconds when active).
- **Accessibility Coupling:** All interactive components subscribe to `AccessibilityContext` to adjust font sizes, outlines, and helper icons; context stays synchronous to prevent flicker.
- **Error Boundaries:** Domain-level boundaries wrap major pages to capture API or rendering errors; fallback UI uses `Info Azure` theme with actionable error descriptions.
- **Theming Flow:** `App.tsx` picks `createAppTheme(isHighVis ? 'high-vis' : 'standard')`; theme object flows through `ThemeProvider`. `Toggle` component writes updates to localStorage and triggers `setMode` re-render.

<!-- anchor: 2-2-core-component-specification -->
### 2.2. Core Component Specification
**Atoms:**
- `Button`: Variants `primary`, `secondary`, `danger`, `ghost`; props for `icon`, `loading`, `ariaLabel`; ensures 44px minimum height and exposes `data-feature` for analytics.
- `IconButton`: Houses icons for toggles, closers, helper triggers; includes tooltip slots, `aria-expanded`, and `highVisSize` overrides.
- `Text`: Standardizes typography variants, color tokens, and text transform; includes `srOnly` boolean to hide visually but remain accessible.
- `InputField`: Wraps MUI TextField with masked input support, validation states, helper text indicator, and optional `FormHelper` injection when accessibility mode active.
- `SelectField`: Multi-select + single-select variations with search; includes `aria-activedescendant` management for keyboard nav.
- `Badge`: Color-coded labels for statuses (`success`, `info`, `warning`, `error`, `neutral`); accepts `icon`, `isOutlined`, `ariaLabel`.
- `Chip`: Filterable pill with `selected`, `disabled`, `removable` states; uses Onyx outlines in High Vis.
- `Avatar`: Displays user initials or board member portrait; includes `aria-label` describing the member and optional status indicator.
- `Divider`: Horizontal lines or dashed separators with high-contrast tokens; optionally renders `srOnly` description for screen readers.
- `SkeletonBlock`: Shimmers or static stripes depending on `AccessibilityContext` to respect `prefers-reduced-motion`.

**Molecules:**
- `FormRow`: Aligns label, control, helper text, and optional `FormHelper`; ensures consistent spacing between stacked fields on mobile.
- `ContactCard`: Shows board member photo, title, term dates, and quick contact CTA; uses `Button` and `Badge` atoms internally.
- `StatusBanner`: Communicates poll status, vendor submission review, or accessibility notices; includes optional actions and links.
- `ToggleGroup`: Houses Accessibility toggle plus other preference toggles; enforces `aria-pressed` states and keyboard navigation.
- `PollOptionCard`: Renders a radio button or checkbox, option description, and vote count preview if allowed; includes helper icon when High Vis active.
- `VoteReceiptChip`: Displays hashed receipt with copy-to-clipboard; uses tooltip to explain verification instructions.
- `TimelineItem`: For board history entries; includes icon, title, member name, start/end dates, and optional `bio` accordion.
- `VendorCard`: Shows vendor category, rating, notes, contact methods; switches layout between grid and list view depending on viewport.
- `HelperTooltip`: Visual `?` icon that wraps text or icon triggers; uses accessible popover semantics with focus trapping.
- `HighVisIndicator`: Inline indicator showing whether high-visibility mode is active; used inside nav, settings.

**Organisms:**
- `BoardRoster`: Fetches roster data, sorts by rank, groups by board title; shows `ContactCard`s, fallback states when data hidden due to visibility flag, and CTA to log in.
- `BoardHistoryTimeline`: Paginated list of `TimelineItem`s with lazy loading; enforces member-only guard and displays skeletons while fetching.
- `BoardContactForm`: Inline or modal form with subject, message, attachments, captcha, and board selection; uses `FormRow`s and `StatusBanner` for success/error feedback.
- `PollList`: Displays active, upcoming, and closed polls; uses filter chips for type and status, `StatusBanner` for urgent polls, and virtualization for performance.
- `PollDetail`: Combines `StatusBanner`, `PollOptionCard`s, `VoteReceiptChip`, and `HelperTooltip`s; ensures form accessible with keyboard and screen readers.
- `VoteAuditPanel`: Admin view for binding polls showing sequential hash chain, export controls, and verification instructions.
- `VendorDirectory`: Grid/list toggle, search, filters, and per-vendor actions; includes submission CTA if user has proper role.
- `AccessibilityPreferencesPanel`: Provides toggles for High Vis, reduced motion, helper icons; persists state to localStorage and user profile.
- `AdminBoardManagement`: Table + modal editing for titles and members; uses `FormRow`s, `TimelineItem` preview, and audit logs panel.
- `ConfigFlagPanel`: Display of feature flags with toggles, descriptions, and audit history; ensures destructive changes require confirmation.

**Templates & Pages:**
- `PageFrame`: Wraps header, breadcrumb, content body, and footer; handles skip-to-content links, accessibility toggle slot, and context providers.
- `BoardPage (frontend/src/pages/Board.tsx)`: Renders `BoardRoster`, `BoardContactForm`, and `BoardHistoryTimeline` (latter behind auth); uses `StatusBanner` to show visibility restrictions.
- `BoardManagementPage (frontend/src/pages/admin/BoardManagement.tsx)`: Houses `AdminBoardManagement`, `ConfigFlagPanel`, and modals for titles/members.
- `PollsPage`: Summaries, filters, CTA to view poll detail, and emphasis on upcoming deadlines.
- `PollDetailPage`: Wraps `PollDetail` organism with route-level data fetching, receipt instructions, and error fallback.
- `VendorsPage`: Renders `VendorDirectory`, context filters, and vendor submission workflow.
- `AccessibilityLanding`: Optional page that explains how to use the Accessibility Suite, linked from nav and first-run modal when new features roll out.
- `AuthGuardedRoute`: Template that checks login + role, surfaces message with CTA to login, and optionally replays previous location after authentication.

**Utility Components:**
- `FeatureFlagGate`: Accepts `flagKey`, `fallback`, `loading`; ensures UI listens to config updates without hard reload.
- `ErrorState`: Friendly placeholder with illustration, descriptive message, and actions; used for network errors, empty states, or permission denials.
- `LoadingState`: Column of skeletons or spinner; respects High Vis by switching to static stripes.
- `NotificationToast`: Multi-purpose toast for toasts triggered by copy actions, errors, or success; accessible `aria-live` and manual close button.

<!-- anchor: 2-3-component-hierarchy-diagram -->
### 2.3. Component Hierarchy Diagram (PlantUML)
~~~plantuml
@startuml
skinparam componentStyle rectangle
skinparam wrapWidth 200
[App Shell]
[App Shell] --> [AccessibilityContext]
[App Shell] --> [ThemeProvider]
[ThemeProvider] --> [createAppTheme]
[App Shell] --> [Router]
[Router] --> [PageFrame]
[PageFrame] --> [Navbar]
[Navbar] --> [Accessibility Toggle]
[PageFrame] --> [ContentRegion]
[ContentRegion] --> [BoardPage]
[ContentRegion] --> [PollsPage]
[ContentRegion] --> [PollDetailPage]
[ContentRegion] --> [VendorsPage]
[ContentRegion] --> [BoardManagementPage]
[BoardPage] --> [BoardRoster]
[BoardPage] --> [BoardContactForm]
[BoardPage] --> [BoardHistoryTimeline]
[BoardRoster] --> [ContactCard]
[BoardContactForm] --> [FormRow]
[BoardHistoryTimeline] --> [TimelineItem]
[PollsPage] --> [PollList]
[PollDetailPage] --> [PollDetail]
[PollDetail] --> [PollOptionCard]
[PollDetail] --> [VoteReceiptChip]
[PollDetail] --> [HelperTooltip]
[BoardManagementPage] --> [AdminBoardManagement]
[AdminBoardManagement] --> [FormRow]
[AdminBoardManagement] --> [TimelineItem]
[VendorsPage] --> [VendorDirectory]
[VendorDirectory] --> [VendorCard]
[All Components] ..> [AccessibilityContext] : consumes
[All Components] ..> [FeatureFlagGate] : conditional rendering
@enduml
~~~

<!-- anchor: 3-0-application-structure -->
## 3. Application Structure & User Flows
Application structure revolves around route-driven layouts, ensuring that both guest and member users encounter predictable navigation. Feature flags determine visibility of certain modules (e.g., democracy features, vendor directory). React Router defines nested routes while `AuthGuardedRoute` components enforce role-based access.

<!-- anchor: 3-1-route-definitions -->
### 3.1. Route Definitions
| Route | Description | Component(s) | Access Level | Feature Flag / Notes |
| --- | --- | --- | --- | --- |
| `/` | Landing dashboard summarizing announcements, polls, vendors | `DashboardPage`, `StatusBanner`, `PollList` preview | Guest + Member | Shows limited data for guests |
| `/board` | Current board roster, contact form, history | `BoardPage` | Guest + Member | `board.visibility` flag decides if roster visible to guests |
| `/board/history` | Full history timeline | `BoardHistoryTimeline` | Authenticated Members | Always restricted per spec |
| `/board/contact` | Contact form only view for deep link emails | `BoardContactForm` | Guest + Member | Rate limited and CAPTCHA protected |
| `/admin/board` | Admin board management console | `BoardManagementPage` | Admin | Requires `board.admin` permission |
| `/polls` | List of polls grouped by status | `PollsPage` | Member | Guests see message encouraging registration |
| `/polls/:id` | View single poll and vote | `PollDetailPage` | Member | `polls.democracy` flag toggles module rollout |
| `/polls/:id/receipts/:hash` | Public verification view | `ReceiptPage` (lightweight) | Guest + Member | Verifies vote hash without exposing user data |
| `/vendors` | Vendor directory grid/list | `VendorsPage` | Member for full data, guests see limited info | `vendors.directory` flag |
| `/admin/vendors` | Admin vendor management | `VendorAdminPage` | Admin | Handles moderation |
| `/accessibility` | Accessibility education + toggles | `AccessibilityLanding` | Guest + Member | Linked from nav |
| `/settings` | User profile + preferences | `SettingsPage` | Member | Allows high-vis preference sync |
| `/login` | Auth gateway | `AuthPage` | Guest | Redirects to prior location |
| `/healthz` | Diagnostics (non-UI) | `HealthPage` placeholder | Internal use | Hit by CI |

Route-level behavior:
- Guests hitting restricted routes are redirected to `/login` with toast message and route stored in session for return navigation.
- Feature flags are pre-fetched via `/config/flags` call; until resolved, protected modules show skeleton placeholder with message referencing rollout status.
- Each route registers breadcrumbs inside `PageFrame`, ensuring screen reader `aria-label="breadcrumb"` and keyboard focus management.

<!-- anchor: 3-2-critical-user-journeys -->
### 3.2. Critical User Journeys (PlantUML)
~~~plantuml
@startuml
skinparam sequenceArrowThickness 2
skinparam roundcorner 15
actor Resident
participant "Board Page" as BoardPage
participant "API /board" as BoardAPI
participant "SendGrid Service" as SendGrid
== Board Contact Flow ==
Resident -> BoardPage: Load /board
BoardPage -> BoardAPI: GET /board (check visibility flag)
BoardAPI --> BoardPage: Roster data or visibility notice
Resident -> BoardPage: Open ContactForm
BoardPage -> BoardAPI: POST /board/contact (subject, message, captcha)
BoardAPI -> SendGrid: sendBoardContactEmail
SendGrid --> BoardAPI: Accepted
BoardAPI --> BoardPage: {status:"accepted", timestamp}
BoardPage -> Resident: Show success banner + receipt message
== Accessibility Toggle Flow ==
Resident -> BoardPage: Toggle High Visibility
BoardPage -> AccessibilityContext: setMode("high-vis")
AccessibilityContext -> localStorage: persist preference
AccessibilityContext -> ThemeProvider: trigger re-render
ThemeProvider -> Resident: UI updates with high-contrast theme
== Poll Voting Flow ==
Resident -> "Poll Detail" as PollDetail: Submit vote
PollDetail -> "API /polls/:id/votes" as VoteAPI: payload (option_id)
VoteAPI -> "VoteIntegrityEngine" as HashService: compute hash chain
HashService --> VoteAPI: vote_hash, receipt
VoteAPI --> PollDetail: receipt + status
PollDetail -> Resident: Display VoteReceiptChip w/ helper tooltip
== Admin Board Management Flow ==
actor Admin
Admin -> "BoardMgmt Page" as AdminPage: Load /admin/board
AdminPage -> "API /admin/board/members" as AdminAPI: fetch roster + history
AdminAPI --> AdminPage: dataset + flags
Admin -> AdminPage: Edit assignment
AdminPage -> AdminAPI: PUT /admin/board/members/{id}
AdminAPI --> AdminPage: Updated record + audit metadata
AdminPage -> Admin: Show confirmation toast + timeline update
@enduml
~~~

<!-- anchor: 4-0-cross-cutting-concerns -->
## 4. Cross-Cutting Concerns
Cross-cutting practices ensure that every module adheres to the foundation mandates: React Query for data management, Accessibility Context for theming, consistent responsive patterns, and tight backend integration with config flags.

<!-- anchor: 4-1-state-management -->
### 4.1. State Management
- **Approach:** Client data flows use React Query hooks (`useBoardRoster`, `usePolls`, `useVendors`, `useConfigFlags`) for server state while local UI preferences such as high visibility mode live in dedicated contexts.
- **Global Contexts:**
  - `AuthContext`: Stores auth token, user profile, roles; exposes `requireRole` helper used by `AuthGuardedRoute`.
  - `AccessibilityContext`: Maintains `isHighVisibility`, `showHelpers`, `reducedMotion`; persistence via localStorage plus optional API sync.
  - `FeatureFlagContext`: Hydrated from `/config/flags`, caches values with TTL, and notifies subscribers when backend updates arrive.
- **React Query Config:** Default `cacheTime` 5 minutes, `retry` 1 for GETs, disabled for POST/PUT; binding poll voting uses `mutation` with `onMutate` to optimistically set local `hasVoted` state.
- **Form State:** Compound forms (board contact, poll creation) use `react-hook-form` for validation, with resolver for Yup schema; ensures consistent error messaging.
- **Error Handling:** Query errors feed into `NotificationToast` with action to retry; forms display inline errors plus `aria-live` polite announcements.
- **Derived State:** Select components compute derived counts (e.g., `PollList` grouping) via memoized selectors to avoid recomputation on every render.
- **Offline Handling:** Basic offline indicator in nav monitors `navigator.onLine`; disables vote submission button and surfaces message to prevent lost entries.
- **Feature Flags:** Each flag's consumer registers fallback UI; e.g., `FeatureFlagGate flagKey="polls.democracy"` renders educational message when disabled.

<!-- anchor: 4-2-responsive-design -->
### 4.2. Responsive Design (Mobile-First)
- **Breakpoints:** `xs <600px`, `sm 600-900px`, `md 900-1200px`, `lg 1200-1536px`, `xl >1536px`; align with MUI defaults for compatibility.
- **Layout Patterns:** Mobile-first approach ensures single column layout by default; `PageFrame` sets `display:flex; flex-direction:column;` and `ContentRegion` uses CSS grid at `md` breakpoint to introduce side panels.
- **Navigation:** On mobile, navbar condenses into hamburger menu with sliding drawer; Accessibility toggle remains persistent as floating `IconButton` pinned to top-right.
- **Tables and Lists:** `BoardHistoryTimeline` uses stacked cards with definition list styling on mobile; on desktop, timeline displays dual-column layout with connector line.
- **Poll Forms:** Options stack vertically with large tap targets; on desktop, optional two-column layout when poll has >6 options, but keyboard order remains top-to-bottom.
- **Vendor Directory:** Mobile view uses card stack with key info prioritized (name, service category, contact button). Desktop view uses multi-column grid with hover states revealing notes.
- **Admin Screens:** Complex tables degrade to accordion lists on small screens; inline editing is replaced by modal forms to maximize tap targets.
- **High Vis & Responsive Combined:** When High Vis is on, media queries increase spacing and enforce simpler layout (no multi-column) to reduce scanning strain; ensures `overflow-wrap` for long email addresses or hashes.

<!-- anchor: 4-3-accessibility -->
### 4.3. Accessibility (WCAG 2.1 AA)
- **Semantic Structure:** All pages begin with `skip to content` link, `main` landmark, semantic headings; board roster uses `section` per title with `aria-labelledby` referencing heading text.
- **Keyboard Support:** Tab order follows DOM order; interactive components include `focus-visible` outlines; modals trap focus and close with ESC.
- **Screen Reader Cues:** `FormHelper` icons only appear when `AccessibilityContext.showHelpers` is true; helper popovers use `aria-describedby` to tie to fields; vote receipt area uses `aria-live="polite"` so screen readers announce hash arrival.
- **Color Contrast:** All standard palette pairings meet 4.5:1 contrast; high vis mode pushes to 7:1; warnings rely on icon + bold text to avoid color-only cues.
- **Reduced Motion:** CSS respects `prefers-reduced-motion` plus the in-app toggle; shimmer loaders disable animation under either condition.
- **Forms & Validation:** Error messages specify both field name and fix instructions (e.g., "Subject must be at least 10 characters"); errors associate with inputs using `aria-describedby` and `role="alert"` for immediate feedback.
- **ARIA Practices:** `PollOptionCard` uses `role="radio"` or `role="checkbox"` with `aria-checked` state; board timeline uses `aria-label="Board leadership timeline"` and `aria-current` for active term.
- **Language Level:** Copy adheres to plain language, avoids jargon, and uses sentence casing for readability; tooltips provide definitions for any legal terms.
- **Testing:** Automated tests with axe-core and manual keyboard sweeps after each release; QA checklist ensures high vis toggles change theme without layout breakage.

<!-- anchor: 4-4-performance-optimization -->
### 4.4. Performance & Optimization
- **Budgets:** Aim for Time to Interactive < 3.0s on entry-level laptops, Largest Contentful Paint < 2.5s on 3G simulation, bundle size per route < 200KB gzipped.
- **Code Splitting:** React Router lazy loads route bundles; polls admin features load separate chunk triggered on demand; vendor admin seldom visited so tree-shaken from main bundle.
- **Caching:** React Query caches GET responses; `Cache-Control` headers set to 60s for board roster, 15s for polls; static assets served from CDN or same host with gzip compression.
- **Image Optimization:** Board portraits stored as WebP, sized to 128x128; fallback to initials to avoid blank avatars; vendor logos constrained to 240px width.
- **Memoization:** Use `memo` on heavy lists (BoardRoster, PollList) plus virtualization when entries exceed 40 items; prevents re-renders when toggling high vis.
- **Form Performance:** Debounce API lookups (e.g., vendor search) at 300ms; use optimistic UI for toggling flags but revert quickly on errors.
- **Monitoring:** In dev mode, use React Profiler to watch for expensive renders when switching accessibility modes; log render durations for poll detail when binding votes heavy.
- **Offline & Low Bandwidth:** Provide `data-saving` toggle to limit auto-refreshing lists; polls page stops live refresh when network flagged as `save-data`.

<!-- anchor: 4-5-backend-integration -->
### 4.5. Backend Integration
- **API Communication:** Use centralized `apiClient` with interceptors applying auth headers, CSRF tokens if present, and error normalization; each module obtains typed functions (e.g., `getBoardRoster`, `submitVote`).
- **Error Management:** Backend errors map to structured messages with `code`, `message`, `details`; UI displays friendly message and logs `code` for support; 401 responses trigger auth refresh.
- **Feature Flags:** Backend `/config/flags` returns TTL metadata; front end caches and only revalidates when TTL expires or background sync indicates update; ensures locked-down modules stay hidden until ready.
- **Security Requirements:** Board contact form includes captcha token, IP metadata; UI collects token via provider and sends to API; failure results in inline warning and disables submit for 30 seconds.
- **Email Feedback:** After contact/poll notifications, UI shows status message referencing `EmailAudit` entry ID so admins can cross-check.
- **Vote Receipt Verification:** Poll detail page links to `/polls/:id/receipts/:hash`; UI uses GET request to confirm hash; on success shows truncated metadata and instructions to contact support if mismatch.
- **High Visibility Preference Sync:** Authenticated users optionally sync preference by calling `/users/me/accessibility`; ensures cross-device continuity.
- **Health Endpoint:** Deployment pipeline hits `/healthz`; UI surfaces small indicator in admin console showing last heartbeat timestamp for transparency.

<!-- anchor: 5-0-tooling-dependencies -->
## 5. Tooling & Dependencies
Tooling choices reflect the foundation mandate: React + Vite + MUI on the front end, Node/Express on the backend, and GitHub Actions for CI/CD. The UI/UX architecture builds on those tools to ensure consistent developer ergonomics.

<!-- anchor: 5-1-core-dependencies -->
### 5.1. Core Dependencies
- **React 18 + TypeScript:** SPA foundation with hooks, Suspense-ready data fetching, strict typing for component props and API responses.
- **Vite:** Fast dev server, module federation possibilities, environment variable injection via `import.meta.env` for feature flags.
- **Material UI (MUI):** Component primitives, theming engine, responsive utilities; `@mui/material`, `@mui/icons-material`, `@mui/lab` for skeleton and timeline components.
- **React Router:** Handles nested routes, data loaders, lazy loading; integrates `AuthGuardedRoute` and `FeatureFlagGate` wrappers.
- **React Query:** Server-state management with caching, retries, mutation hooks for voting and contact form submissions.
- **React Hook Form + Yup:** Form state and validation; ensures consistent inline error display and schema sharing with backend DTOs.
- **Framer Motion (light usage):** Subtle animations for expanding timeline items and toast transitions; automatically disabled via `reduced motion` check.
- **date-fns:** Formatting board terms, vendor update timestamps, poll countdowns; ensures timezone-safe operations.
- **zxcvbn-lite (optional):** For admin password checks when resetting (if required) to keep UI consistent, though not central to features.
- **axe-core / jest-axe:** Accessibility linting in tests; ensures new components remain WCAG compliant.

<!-- anchor: 5-2-development-tooling -->
### 5.2. Development Tooling
- **ESLint + Prettier:** Enforce code style, import sorting, and linting rules, including `jsx-a11y` for accessibility best practices.
- **Jest + React Testing Library:** Unit tests for components, contexts, and hooks; snapshot tests verify theming output for standard vs high-vis variations.
- **Storybook (optional lightweight setup):** Documents components, tokens, and state variants; includes accessibility addon to simulate high-vis mode and colorblind filters.
- **Vite Preview + Playwright Smoke Tests:** Run critical flows (board contact, poll vote) in CI to catch regressions before deploy.
- **GitHub Actions:** `ci.yml` handles lint, test, npm audit; `deploy.yml` builds Docker image, runs container, curls `/healthz`, pushes to GHCR.
- **Localization Framework (placeholder):** Even though English-only, keep `i18next` minimal config to allow future translation; ensures text centralized.
- **Accessibility QA Checklist:** Markdown checklist stored in repo; designers run through after major UI changes; automated script verifies anchors and contexts.
- **Design Handoff Assets:** Figma library referencing same tokens; includes color styles for both modes, auto-layout components mirroring React structure.

<!-- anchor: 1-5-imagery-iconography -->
### 1.5. Imagery & Iconography
- **Photography Style:** Use candid, community-oriented images with soft desaturation to maintain consistency with muted palette; images should focus on people collaborating (board meetings, community maintenance) and avoid staged corporate stock art.
- **Image Treatment:** Apply rounded corners (16px) and subtle drop shadow equal to `elevation-sm`; in High Vis, replace drop shadow with double border to preserve contrast.
- **Icon Library:** Utilize Material Icons two-tone set for compatibility; customize stroke weight to 2px for clarity at 24-32px sizes; icons must include `aria-label` and optional text labels beneath for critical actions.
- **High Vis Icon Adjustments:** Fill icons with solid Onyx, add 1px white inner stroke to separate from dark backgrounds, and enforce minimum 28px size; ensure icons remain legible when fonts scale by 25%.
- **Illustrations:** When vector illustrations are needed (e.g., empty states), rely on Figma components using the brand palette; provide alternate outlines for high-contrast needs.
- **Avatar Handling:** Default to initials using `Avatar` atom with contrasting colors, but allow optional image upload for board members; fallback colors align with accent palette to avoid jarring randomness.
- **File Formats:** Use WebP for photos, SVG for icons/illustrations; limit file sizes to <200KB to keep page lightweight on Linode host.
- **Alt Text Standards:** Describe context (e.g., "Neighbors planting flowers during spring clean-up") rather than describing purely visual traits; ensure every decorative image uses empty alt to avoid noise.
- **Icon Usage Patterns:** Pair icons with text for actions like "Notify Members" or "Contact Board"; do not rely on icons alone to convey destructive actions.
- **Badges & Avatars:** Board titles appear as text below avatars to prevent reliance on hover; timeline uses icons to differentiate past vs current tenure but text remains primary cue.

<!-- anchor: 1-6-tone-microcopy -->
### 1.6. Tone & Microcopy Guidelines
- **Voice Principles:** Friendly, transparent, and civic-minded; always prefer "we" and "our community" over corporate phrasing.
- **Action Labels:** Use verbs that describe results ("Submit Vote", "Send Message", "Add Vendor") and avoid ambiguous labels like "Go".
- **Error Copy:** Provide context + action, e.g., "We could not send your message because the captcha expired. Please try again." Include support email in persistent failures.
- **Success Messages:** Celebrate participation ("Thanks for strengthening our HOA governance!") without sounding gamified.
- **Helper Text:** Written at a 6th-grade reading level, short sentences, and plain vocabulary; highlight what information is required and why.
- **Empty States:** Encourage action with next steps ("No vendors added yet. Use the button above to share a trusted contractor."), provide documentation links, and include illustration for warmth.
- **Tooltips:** Limit to one sentence; use them to clarify legal or procedural terminology ("Binding poll: results must be honored per bylaws.").
- **Notifications:** Provide time references ("Updated 2 minutes ago") and include close buttons labeled for screen readers.
- **Onboarding Banners:** For new modules, display dismissible banners summarizing benefits and linking to documentation; store dismissal per user in localStorage for now.
- **Microcopy Maintenance:** Keep dictionary in repo describing canonical terms (e.g., always say "Board Member" not "Director") so UI remains consistent.

<!-- anchor: 2-4-interaction-patterns -->
### 2.4. Interaction Patterns & Microstates
- **Loading States:** Use skeletons for lists and cards lasting >300ms; fallback spinner for short-lived actions like toggling visibility flags; always accompany with descriptive text ("Loading board history...").
- **Empty States:** Provide icon/illustration, short description, and CTA; differentiate between "no data yet" vs "filtered out" by customizing message based on query parameters.
- **Error States:** Inline errors for form fields, toast alerts for global failures, and dedicated error panels when API unreachable; include "Retry" button that re-triggers last action.
- **Confirmation Modals:** For destructive or binding actions (e.g., closing poll, deleting vendor) display modal with summary of change, potential impact, and `type CONFIRM to continue` input to prevent mistakes.
- **Progress Indicators:** Poll creation wizard uses stepper component with labels (Details → Options → Notifications → Review); highlight active step with accent color and `aria-current` attribute.
- **Real-Time Feedback:** Vote submission button disables on click, transitions to spinner state, and re-enables after response; success state displays check icon plus `VoteReceiptChip`.
- **Form Autosave:** Admin board management forms autosave drafts to local storage; display "Draft saved" inline status with timestamp to reassure users.
- **Notifications Panel:** Top-right icon opens list of toasts with scroll; each toast includes context, timestamp, and ability to mark as read; ensures focus returns to triggering element when panel closes.
- **Touch Feedback:** Buttons enlarge hit area via invisible padding; add ripple effect disabled when reduced motion flag set.
- **Shortcut Support:** Desktop admin tables respond to `Ctrl+K` search and `?` key to open keyboard shortcut overlay; overlay uses accessible dialog semantics.
- **State Persistence:** Filters for polls/vendors persist via query string and local storage; when returning to page, UI restores last filter set plus notifies user via toast ("Restored filters from previous visit").
- **Toast Stack Behavior:** Display at most three toasts simultaneously, queue remainder; each toast auto-dismisses after 6 seconds unless critical (error).

<!-- anchor: 3-3-content-strategy -->
### 3.3. Content Strategy & Messaging
- **Dashboard Messaging:** Feature high-value calls to action first (vote now, review board updates); rotate announcements weekly to prevent banner blindness.
- **Board Page Copy:** Provide short introduction explaining board responsibilities, meeting cadence, and contact expectations; include reference to bylaws for legitimacy.
- **Poll Descriptions:** Encourage admins to write neutral, plain-language descriptions with `Why`, `Options`, and `Deadline` subheadings; UI enforces minimum length to ensure clarity.
- **Vendor Notes:** Members adding vendors must provide short testimonial; UI prompts "How did this vendor help our community?" and limits to 300 characters for succinctness.
- **Accessibility Onboarding:** Feature card near nav describing high-vis benefits with "Learn more" linking to `/accessibility`; new visitors see dismissible modal summarizing toggles.
- **Notifications Emails:** When polls or board updates trigger email, include summary of UI interactions ("Cast your vote online"), deep link to poll detail, and note about verifying receipts.
- **Terminology Consistency:** All modules refer to "members" rather than "users"; use "guests" when describing unauthenticated visitors; ensure copy references "SendGrid" or integrations only in admin docs, not user-facing text.
- **Voice for Alerts:** Warnings should state urgency and action ("Binding vote closes in 2 hours. Cast your vote."), while info banners remain calm and instructive.
- **Help Content Links:** Each complex form surfaces `Learn More` link to documentation; opens new tab but warns user to save progress before leaving.
- **Localization Preparedness:** Copy stored in translation JSON to future-proof; even if only English, this ensures consistent text reuse and easier updates.

<!-- anchor: 3-4-feature-flag-rollouts -->
### 3.4. Feature Flag Rollouts & Onboarding Flows
- **Flag Metadata Display:** Admin console lists each flag with description, default state, scope (guest/member/admin), and recommended testing checklist.
- **Gradual Exposure:** When enabling `polls.democracy`, system first enables UI for admins only, then for small member segment; UI surfaces "Preview" badge to remind testers the feature is beta.
- **Announcement Banner:** When a major module goes live (Accessibility Suite, Democracy module), show site-wide banner linking to release notes; include "Dismiss" button storing preference per user.
- **Guided Tours:** Use lightweight coach mark overlay for complex flows (poll creation, board management). Each step includes `Next`, `Back`, and `Skip tour` accessible buttons; tours respect reduced motion and high vis.
- **Feedback Loop:** After new feature usage, trigger optional modal asking "Was this helpful?"; includes yes/no with text area; responses stored for UX iteration.
- **Flag Fallbacks:** If flag turned off after being on, UI gracefully hides modules and shows friendly message ("This feature is temporarily unavailable as we make improvements.") rather than 404.
- **Version Badges:** Display small `beta` or `new` badges near nav items for 30 days after release; automatically expire using timestamp stored in config.
- **Telemetry:** On first toggle of new feature, send structured analytics event with anonymized user role to monitor adoption while respecting privacy constraints.
- **Documentation Links:** Each flag includes "Docs" button pointing to Markdown spec within repo so admins understand scope and dependencies.

<!-- anchor: 4-6-observability-telemetry -->
### 4.6. Observability & Telemetry
- **Frontend Logging:** Use console grouping in development for board/poll actions, but strip logs in production except warnings/errors; high vis toggles log only anonymized preference changes.
- **Analytics Events:** Minimal event schema capturing `action`, `entity`, `context`, `featureFlagState`; stored locally or sent to lightweight endpoint for aggregated reporting, respecting privacy guidelines.
- **User Feedback Widget:** Inline feedback link in footer opens modal to capture suggestions; responses route to backend `ContactRequest` variant for triage; UI ensures `aria-live` to confirm submission.
- **Performance Measurements:** Collect Web Vitals (LCP, FID, CLS) and send to backend for logging; admin console displays aggregated stats so volunteers know if changes hurt performance.
- **Error Reporting:** Use existing logging infrastructure to capture UI errors via `window.onerror` and `ErrorBoundary`; include feature flag states and accessibility mode in payload for easier debugging.
- **Health Badges:** Admin header shows badge summarizing `/healthz` results (API reachable, DB connected, config cache warm). Badge uses color tokens (green success, amber warning, red error) and textual labels for screen readers.
- **Rate Limit Alerts:** If contact form hits rate limit, UI surfaces alert with countdown timer until next attempt allowed; timer uses accessible live region.
- **Audit Trail Visibility:** Admin pages show "Last updated by" metadata for board roster, polls, and vendors; ensures trust and encourages responsible edits.

<!-- anchor: 5-3-collaboration-workflow -->
### 5.3. Collaboration & Workflow
- **Design-Dev Handoff:** Figma files include component specs referencing same token names as code; designers annotate states (default, hover, focus, high vis) and link to Jira tickets.
- **Documentation Process:** Each new UI module ships with README describing props, data requirements, feature flags, and QA checklist; stored alongside component directories.
- **Review Ritual:** Weekly design review ensures board volunteers preview prototypes; incorporate feedback before merging to keep trust with non-technical stakeholders.
- **Branch Strategy:** Use feature branches per module (`feature/board-history-ui`) with PR templates requiring accessibility checklist confirmation.
- **Testing Sign-off:** QA testers run Playwright smoke tests plus manual scenarios (keyboard nav, mobile view, high-vis toggle) before PR merges.
- **Release Notes:** Admin accessible page summarizing new UI features, bug fixes, and known issues; content pulled from Markdown changelog updated before each deploy.
- **Knowledge Sharing:** Short Loom videos walking through new flows stored in repo links; helps volunteer turnover.
- **Support Workflow:** Within admin console, include link "Report UI issue" which opens GitHub issue template pre-filled with environment info; ensures consistent bug reports.
- **Design Debt Tracking:** Maintain list of UI debt items (e.g., inconsistent spacing) prioritized quarterly; ensures small inconsistencies addressed before they pile up.

<!-- anchor: 5-4-testing-matrix -->
### 5.4. Testing Matrix & QA Automation
- **Unit Tests:** Cover tokens (`theme.test.ts` verifying standard vs high-vis values), contexts (`AccessibilityContext.test.tsx`), and components (BoardRoster, PollDetail) ensuring conditional rendering based on feature flags.
- **Integration Tests:** Playwright scripts for board contact submission, poll voting (informal vs binding), vendor filtering, accessibility toggle persistence, and admin board edits.
- **Visual Regression:** Storybook Chromatic or percy snapshots to catch color/spacing regressions, especially high-vis theme.
- **Accessibility Automation:** `jest-axe` scans on critical pages; fails CI if WCAG violations appear; manual wheel/touch testing ensures interactive targets remain large enough.
- **Performance Testing:** Lighthouse CI runs on `/board`, `/polls/:id`, `/vendors`; tracks metrics over time and enforces budgets; flagged results block deploy until resolved.
- **Cross-Browser Matrix:** Chrome, Firefox, Safari, Edge latest two versions; ensure fallback experience for older browsers by maintaining CSS compatibility (no unsupported features without polyfills).
- **Device Testing:** iPhone SE, iPad Mini, Pixel 5, small Windows laptop; ensures layout scales across typical resident hardware.
- **Regression Checklist:** After schema or flag updates, run manual checklist verifying board visibility toggles, accessibility toggles, and poll hash verification flows.

<!-- anchor: 4-7-security-ux -->
### 4.7. Security-Oriented UX Patterns
- **Auth Feedback:** Login and session refresh flows show inline status ("Verifying..."), failure messages reference lockout duration, and success redirects announce "Welcome back" for screen readers.
- **Role Visibility:** Nav shows admin-only sections behind `FeatureFlagGate` and `AuthGuardedRoute`; when unauthorized user attempts access, UI displays friendly explanation and support contact rather than generic 403 page.
- **Sensitive Actions:** Changing board roster or poll type requires password re-entry or 2FA confirmation if available; UI hints remind admins "Security step ensures only you can approve this change."
- **Email Privacy:** Board contact submissions obfuscate recipient list ("Your message will be routed to active board members") to prevent enumerating emails.
- **Hash Receipts:** Display truncated hash plus "Copy full hash" button; instruct users not to share screenshot containing personal notes; include tooltip explaining why receipts matter.
- **Rate Limit Messaging:** When IP rate limit triggered, show countdown timer and suggest contacting support if urgent; prevents frustration while keeping system safe.
- **Idle Timeout Warning:** Show modal when session nearing expiration with countdown and "Stay signed in" button; accessible, focus-trapped, and respects reduced motion.
- **Audit Visibility:** Admin UI surfaces "Last modified by" meta plus link to audit log; fosters accountability and discourages unauthorized edits.
- **Cookie Consent:** Banner explains use of essential cookies for auth and preference storage; minimal design to avoid blocking content yet collects acknowledgement for compliance.
- **Secure Document Uploads:** Board contact form provides file upload guidelines ("PDF or JPG up to 5MB"), virus scan messaging, and fallback instructions for alternative submission.

<!-- anchor: 5-5-release-playbook -->
### 5.5. Release Playbook & Training
- **Pre-Release Checklist:** Designers confirm Figma specs match implemented components, QA signs off on accessibility + responsive tests, and product owner reviews copy; checklist stored in repo.
- **Staging Demos:** Before enabling new flag, run recorded walkthrough for HOA board to gather approval; store video link in release notes.
- **Training Materials:** Create short PDFs or slides summarizing new workflows (e.g., "How to run a binding poll"); link directly from relevant pages via `HelperTooltip` or info banners.
- **Rollout Calendar:** Maintain shared calendar noting when features enable for segments; UI references this to display "Upcoming" labels on nav items.
- **Support Escalation:** Document support channels (email alias, phone) within admin console; escalate critical issues via Slack/email; include fallback plan if SendGrid unreachable.
- **Post-Release Monitoring:** Within 24 hours of release, check metrics (errors, load times, adoption) and gather user feedback; `Release Dashboard` component in admin view summarizes stats.
- **Hotfix Procedure:** In event of severe UI bug, disable feature flag immediately while patching; UI ensures message informs users of temporary rollback.
- **Volunteer Training:** Provide quarterly remote training for new board/admin members covering data entry, poll creation, accessibility features, and support process; record sessions for asynchronous viewing.
- **Documentation Updates:** After each release, update `CHANGELOG.md`, user guides, and inline helper text to reflect new behaviors; include version number in footer.
- **Retrospectives:** Conduct brief retro after major releases focusing on UX pain points, accessibility regressions, and communication gaps; document action items with owners and due dates.

<!-- anchor: 2-5-data-visualization -->
### 2.5. Data Visualization Standards
- **Chart Types:** Poll results use horizontal bar charts for clarity, board participation stats use simple donut charts with center labels, and vendor satisfaction trends use spark lines; avoid overly complex visualizations that could confuse residents.
- **Color Mapping:** Map `success`, `info`, `warning`, `error` tokens to chart segments; ensure same order across views so residents associate colors with outcomes consistently.
- **Legends:** Always display text labels adjacent to data rather than requiring hover; High Vis mode increases legend font size and adds outlines around swatches.
- **Interaction:** Hover tooltips show exact counts and percentages with friendly descriptions ("32 votes • 48%"); tooltips support keyboard focus and `aria-live` updates when data refreshes.
- **Data Refresh:** Poll detail page auto-refreshes results every 20 seconds when poll open; toolbar includes "Pause updates" toggle for accessibility needs; status text logs last refresh timestamp.
- **Exporting:** Admins can export CSV or PDF of poll results; UI shows confirmation toast, handles long-running exports via progress indicator, and warns about PII removal.
- **Empty & Partial Data:** When no votes submitted, show placeholder message ("Waiting for first vote") plus CTA to notify members; charts hide axes to avoid zeroed bars.
- **Responsive Behavior:** On mobile, charts stack vertically with collapsed legends; on desktop, align chart and legend side-by-side while ensuring at least 48px between interactive elements.
- **Animation:** Bars animate from zero to value over 400ms using easing; disabled when reduced motion flag set; high vis adds sequential outlines appearing as data loads to reinforce clarity.
- **Data Integrity Messaging:** Beneath charts, include "Verified via hash chain" note with link to verification instructions; fosters trust in democracy module.

<!-- anchor: 3-5-offline-strategy -->
### 3.5. Offline & Low Connectivity Strategy
- **Offline Detection:** `useNetworkStatus` hook listens to `online`/`offline` events; displays banner "You're offline" with instructions and disables form submissions to prevent data loss.
- **Deferred Actions:** When contact form or vote attempted offline, store payload locally and prompt user to resend once connection restores; ensures transparency by showing queued count.
- **Lightweight Assets:** Provide "Low bandwidth" toggle under accessibility panel that replaces hero images with flat color panels and pauses auto-refresh across polls.
- **Caching Strategy:** Use service worker (optional) to cache static assets and route shells; ensures board roster or vendor directory accessible even when offline, albeit read-only.
- **Sync Feedback:** After reconnect, UI surfaces toast summarizing which queued actions succeeded or failed, linking to detail modal for any unresolved items.
- **Data Freshness Indicators:** Each list and chart shows "Updated X minutes ago" timestamp; when stale >5 minutes, background color shifts to subtle warning amber to prompt manual refresh.
- **Timeout Handling:** API interactions display inline progress indicator and auto-cancel after 10 seconds with friendly retry CTA; prevents hanging states on slow networks.
- **Asset Prioritization:** Lazy-load large modules (vendor images, admin analytics) only when viewport enters; reduces initial bandwidth for mobile data users.
- **Accessibility Considerations:** Offline banner uses `role="status"` so screen readers announce connectivity change; theme ensures high contrast even in amber warning state.
- **Documentation:** `/accessibility` page includes section explaining offline behaviors so residents know what to expect during outages.
