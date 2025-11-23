<!-- anchor: iteration-2-plan -->
### Iteration 2: Accessibility Suite & Frontend Foundations

*   **Iteration ID:** `I2`
*   **Goal:** Deliver Accessibility Suite MVP (context, theming, helper UI) and integrate updated board UX with new APIs while documenting reusable tokens for later modules.
*   **Prerequisites:** `I1` completed migrations, diagrams, and board APIs/OpenAPI updates.
*   **Tasks:**

<!-- anchor: task-i2-t1 -->
*   **Task 2.1:**
    *   **Task ID:** `I2.T1`
    *   **Description:** Implement `AccessibilityContext.tsx` with persisted `isHighVisibility`, `showHelpers`, reduced motion flags, localStorage sync, Config flag bootstrap, and associated Jest/RTL tests.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Requirements 2.2, board endpoints for config flags
    *   **Input Files:** [`frontend/src/contexts/AccessibilityContext.tsx`, `frontend/src/contexts/FeatureFlagContext.tsx`, `frontend/src/tests/AccessibilityContext.test.tsx`]
    *   **Target Files:** [`frontend/src/contexts/AccessibilityContext.tsx`, `frontend/src/tests/AccessibilityContext.test.tsx`, `docs/design/accessibility-suite.md`]
    *   **Deliverables:** Context provider + hook, persistence helper, doc snippet describing usage + feature flag dependencies.
    *   **Acceptance Criteria:** Context toggles update theme instantly, preference stored for guest/member, tests cover default, toggle, storage, reduced-motion states, docs explain integration steps.
    *   **Dependencies:** `I1.T4`, `I1.T5`
    *   **Parallelizable:** No (foundation for downstream tasks)

<!-- anchor: task-i2-t2 -->
*   **Task 2.2:**
    *   **Task ID:** `I2.T2`
    *   **Description:** Produce Accessibility Theme Token Spec (Markdown + JSON) enumerating color, typography, spacing, and component tokens for standard vs high-vis; align with Section 1 design guidance.
    *   **Agent Type Hint:** `DocumentationAgent`
    *   **Inputs:** Provided UI/UX doc, Task 2.1 context contract
    *   **Input Files:** [`docs/design/accessibility-theme-tokens.md`, `frontend/src/theme/tokens.json`]
    *   **Target Files:** [`docs/design/accessibility-theme-tokens.md`, `frontend/src/theme/tokens.json`]
    *   **Deliverables:** Token reference doc + machine-readable token file for `createAppTheme` consumption.
    *   **Acceptance Criteria:** Tokens cover palette/typography/spacing/states, JSON validated, Markdown cross-links to context doc, reviewers confirm parity with requirements.
    *   **Dependencies:** `I2.T1`
    *   **Parallelizable:** Yes (doc + data entry once context contract defined)

<!-- anchor: task-i2-t3 -->
*   **Task 2.3:**
    *   **Task ID:** `I2.T3`
    *   **Description:** Refactor `frontend/src/theme/theme.ts` to export `createAppTheme(mode: 'standard' | 'high-vis')`, wire into `App.tsx`, update `ThemeProvider`, and ensure MUI component overrides (buttons, typography, focus rings) respect tokens.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Theme tokens, context provider
    *   **Input Files:** [`frontend/src/theme/theme.ts`, `frontend/src/App.tsx`, `frontend/src/components/layout/Navbar.tsx`, `frontend/src/components/common/Button.tsx`]
    *   **Target Files:** [`frontend/src/theme/theme.ts`, `frontend/src/App.tsx`, `frontend/src/components/layout/Navbar.tsx`, `frontend/src/tests/theme.test.ts`]
    *   **Deliverables:** Theme factory, provider wiring, updated navbar to consume theme + toggle slot, Jest snapshot tests verifying palette/typography diffs.
    *   **Acceptance Criteria:** Toggle updates theme without reload, theme exports typed tokens, tests snapshot both modes, lint/test pass.
    *   **Dependencies:** `I2.T1`, `I2.T2`
    *   **Parallelizable:** No (core integration)

<!-- anchor: task-i2-t4 -->
*   **Task 2.4:**
    *   **Task ID:** `I2.T4`
    *   **Description:** Build `AccessibilityToggle` component (Navbar button with tooltip, icons, `aria-pressed` states) and integrate into global nav + mobile drawer; include tooltip copy + analytics hook.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Theme + context work
    *   **Input Files:** [`frontend/src/components/Accessibility/Toggle.tsx`, `frontend/src/components/layout/Navbar.tsx`, `frontend/src/components/layout/MobileMenu.tsx`, `frontend/src/tests/AccessibilityToggle.test.tsx`]
    *   **Target Files:** [`frontend/src/components/Accessibility/Toggle.tsx`, `frontend/src/components/layout/Navbar.tsx`, `frontend/src/components/layout/MobileMenu.tsx`, `frontend/src/tests/AccessibilityToggle.test.tsx`]
    *   **Deliverables:** Toggle component + tests covering keyboard nav, tooltip text, analytics event stub.
    *   **Acceptance Criteria:** Button meets 44px touch area, `aria-pressed` toggles, tooltip text matches spec, tests verifying focus + persistence.
    *   **Dependencies:** `I2.T3`
    *   **Parallelizable:** Yes (after `I2.T3` theme plumbing)

<!-- anchor: task-i2-t5 -->
*   **Task 2.5:**
    *   **Task ID:** `I2.T5`
    *   **Description:** Implement `FormHelper` molecule that renders contextual `?` icon with popover text when Accessibility mode enabled; retrofit Board contact form fields and admin board modals to use new helper + high-vis spacing.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** Context + toggle + board UI
    *   **Input Files:** [`frontend/src/components/common/FormHelper.tsx`, `frontend/src/components/Board/ContactForm.tsx`, `frontend/src/pages/admin/BoardManagement.tsx`, `frontend/src/tests/FormHelper.test.tsx`]
    *   **Target Files:** [`frontend/src/components/common/FormHelper.tsx`, `frontend/src/components/Board/ContactForm.tsx`, `frontend/src/pages/admin/BoardManagement.tsx`, `frontend/src/tests/FormHelper.test.tsx`]
    *   **Deliverables:** Helper component, board form updates, tests for conditional render + popover behavior, documentation snippet for usage.
    *   **Acceptance Criteria:** Helpers appear only in high-vis mode, popover accessible (aria-controls, focus trap), board forms meeting contrast guidelines, tests verifying gating.
    *   **Dependencies:** `I2.T4`, `I1.T4`
    *   **Parallelizable:** Yes (after toggle ready)

<!-- anchor: task-i2-t6 -->
*   **Task 2.6:**
    *   **Task ID:** `I2.T6`
    *   **Description:** Update Board page + layout skeleton to consume new board endpoints (visibility flag metadata) and Accessibility cues, ensuring React Query caches incorporate TTL + skeleton states; include axe accessibility regression tests.
    *   **Agent Type Hint:** `FrontendAgent`
    *   **Inputs:** New APIs + UI components
    *   **Input Files:** [`frontend/src/pages/Board.tsx`, `frontend/src/components/Board/BoardRoster.tsx`, `frontend/src/components/Board/BoardHistoryTimeline.tsx`, `frontend/src/api/board.ts`, `frontend/src/tests/BoardPage.test.tsx`]
    *   **Target Files:** same as inputs plus `frontend/src/tests/BoardPage.a11y.test.tsx`
    *   **Deliverables:** Board page wiring to config metadata + helper components, tests verifying feature flag gating + accessibility compliance.
    *   **Acceptance Criteria:** Loading + empty states align with accessibility copy, TTL metadata displayed, tests cover roster/historical gating + axe scan passes, CSS meets high-vis spacing.
    *   **Dependencies:** `I2.T5`
    *   **Parallelizable:** No (capstone)

*   **Iteration Exit Criteria:** Accessibility toggle + context working across desktop/mobile, Board UI aligned with tokens, documentation + token files published, axe + RTL suites green, release notes mention feature flag defaults (`accessibility.high-vis-default=false`).
*   **Metrics & Checkpoints:** Track toggle latency (<100ms), board page LCP <=2.5s with high-vis active, React Query cache TTL logs, axe violation count must be zero, backlog of helper copy approvals cleared.
*   **Iteration Risks:** Potential CSS regressions from global theme change (mitigate via Storybook visual diff), localStorage sync race conditions on multi-tab (test with `storage` events), board members needing updated copy for helper text (coordinate with comms sub-team).
*   **Resource Allocation:** Frontend agents 70%, documentation agent 20%, QA 10% dedicated to accessibility sweeps; ensure pairing sessions for theme + context tasks to spread knowledge.
*   **Hand-off Notes:** Provide `AccessibilityContext` usage guide + tokens to democracy + vendor squads, capture GIF demo for board to preview before enabling flag for residents.
*   **Tooling Requirements:** Add `npm run test:accessibility` (axe) to CI, update Storybook stories to include high-vis controls, ensure lint config enforces `aria-*` props on toggles/helpers.
*   **Review Strategy:** Conduct mid-iteration accessibility audit with board accessibility liaison, gather sign-off for helper copy, and demo high-vis board page before merging to `main`.
*   **Next Iteration Inputs:** Document any component API adjustments (e.g., `FormHelper` props) and share with democracy module backlog so poll detail screens adopt the same UX patterns.
*   **Collaboration Hooks:** Pair with communications volunteer to vet helper text tone, sync with backend agent on config flag TTL values, and coordinate with QA on device test schedule (mobile + desktop) before release.
*   **Documentation Links:** Update `docs/design/accessibility-suite.md` with GIFs/screens + link to tokens doc, ensuring I3+ squads know where to find helper copy guidelines.
*   **Retrospective Focus:** Capture metrics on helper usage, toggle adoption, and CSS regression pain points to inform Democracy + Vendor UI rollouts and adjust process quickly.
*   **Operational Notes:** Feature flag defaults remain off in production; prepare admin enablement script + rollback checklist describing how to revert tokens/context changes safely if regressions appear.
*   **Testing Scope:** Execute manual keyboard-only and screen-reader sweeps (NVDA/VoiceOver) on Board page + nav; capture findings in `docs/testing/accessibility-report.md` for compliance traceability.
*   **KPIs to Watch:** Toggle adoption (target 30% of pilot members), helper icon usage events, and number of accessibility-related support tickets logged during pilot week.
*   **Release Comms:** Draft resident-facing announcement template explaining High Visibility mode and store in `docs/runbooks/release-communications.md` for reuse by board secretaries.
