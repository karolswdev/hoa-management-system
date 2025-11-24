# Accessibility Suite Design Documentation

<!-- anchor: accessibility-suite-design -->

**Version:** 1.0
**Last Updated:** 2025-11-23
**Owner:** Frontend Team
**Status:** ✅ Production Ready

**Related Documentation:**
- [Accessibility Theme Tokens](./accessibility-theme-tokens.md)
- [UI/UX Architecture Section 1.0](../../.codemachine/artifacts/architecture/06_UI_UX_Architecture.md#1-0-accessibility-first-design-principles)
- [Accessibility Context Implementation](../../frontend/src/contexts/AccessibilityContext.tsx)

---

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Accessibility Modes](#accessibility-modes)
4. [Component Specifications](#component-specifications)
5. [User Journeys](#user-journeys)
6. [Testing & Validation](#testing--validation)
7. [Implementation Status](#implementation-status)
8. [Future Enhancements](#future-enhancements)

---

## 1. Overview

### 1.1 Purpose

The Accessibility Suite is a comprehensive set of design patterns, components, and runtime features that ensure the HOA Management System meets WCAG 2.1 AA standards and provides an inclusive experience for users with diverse abilities. This includes visual impairments, motor disabilities, cognitive differences, and situational limitations (e.g., bright sunlight, small screens).

### 1.2 Scope

**In Scope:**
- **Visual Accessibility:** High-contrast themes, scalable fonts, color-blind safe palettes
- **Motor Accessibility:** Large touch targets, keyboard navigation, reduced motion
- **Cognitive Accessibility:** Clear hierarchies, consistent patterns, simplified workflows
- **Screen Reader Support:** ARIA labels, semantic HTML, focus management

**Out of Scope (Future):**
- **Multilingual Support:** Internationalization (i18n) deferred to future iterations
- **Voice Control:** Speech recognition and voice commands
- **Braille Display Integration:** Specialized hardware support

### 1.3 Target Users

**Primary Personas:**
- **Vision-Impaired Users:** Low vision, color blindness, screen reader users
- **Motor-Impaired Users:** Limited dexterity, keyboard-only navigation
- **Aging Users:** Older adults with declining vision/motor skills (60+ age demographic)
- **Situational Users:** Mobile users in bright sunlight, users with temporary injuries

---

## 2. Design Principles

### 2.1 Accessibility-First Development

**Principle:** Accessibility is a core requirement, not an afterthought.

**Implementation:**
- Accessibility requirements defined in user stories
- WCAG 2.1 AA conformance tested in CI/CD pipeline
- Manual testing with screen readers (NVDA, VoiceOver, TalkBack)
- Design reviews include accessibility checklists

### 2.2 Progressive Enhancement

**Principle:** Core functionality works without JavaScript or CSS.

**Implementation:**
- Semantic HTML provides baseline structure
- CSS enhances visual presentation
- JavaScript adds interactive enhancements
- Forms submit via native browser behavior (before React hydration)

### 2.3 Multi-Modal Design

**Principle:** Critical information conveyed through multiple sensory channels.

**Implementation:**
- Color + text labels (not color alone)
- Icons + descriptive text
- Visual + auditory feedback (ARIA live regions)
- Touch + keyboard + mouse support

### 2.4 User Control

**Principle:** Users control their experience through preferences.

**Implementation:**
- Theme toggle (standard ↔ high-visibility)
- Font size scaling (future enhancement)
- Motion reduction (respects OS `prefers-reduced-motion`)
- Persistent preferences via `localStorage`

---

## 3. Accessibility Modes

### 3.1 Standard Mode

**Target Audience:** General users without specific accessibility needs

**Visual Characteristics:**
- **Color Palette:** Full-spectrum colors with WCAG AA contrast ratios
- **Typography:** Base font size 16px, line height 1.5
- **Spacing:** Standard touch targets (44px minimum)
- **Effects:** Subtle shadows, smooth animations, rounded corners

**Use Cases:**
- Desktop browsing on high-resolution displays
- Mobile browsing in normal lighting conditions
- Users without visual impairments

**Design Token References:** See [Accessibility Theme Tokens](./accessibility-theme-tokens.md) for complete token specifications.

---

### 3.2 High-Visibility Mode

**Target Audience:** Users with low vision, color blindness, or situational visibility challenges

**Visual Characteristics:**
- **Color Palette:** High-contrast black/white with limited accent colors
- **Typography:** 22% larger fonts (base 19.52px), increased line height
- **Spacing:** Larger touch targets (52px minimum), expanded padding
- **Effects:** Solid borders replace shadows, animations disabled, sharp corners (4px radius)

**Contrast Ratios:**
- **Body Text:** 21:1 (black on white) - Exceeds AAA standard (7:1)
- **Large Text (18pt+):** 21:1 - Exceeds AAA standard (4.5:1)
- **UI Components:** 15:1 minimum - Exceeds AAA standard (3:1)

**Use Cases:**
- Low vision users requiring maximum contrast
- Color-blind users (patterns/borders distinguish elements)
- Mobile users in bright sunlight
- Aging users with declining vision

**Activation:**
- User toggles via accessibility icon in navbar
- Preference persists across sessions (localStorage: `hoa_accessibility_mode`)
- Applies instantly without page reload

**Design Token Overrides:** See [Accessibility Theme Tokens Section 1-8](./accessibility-theme-tokens.md) for mode-specific token values.

---

## 4. Component Specifications

### 4.1 Accessibility Toggle Component

**Component:** `AccessibilityToggle` (navbar widget)

**Functionality:**
- Single-click toggle between standard/high-vis modes
- Displays current mode via icon + tooltip
- Announces mode changes to screen readers (`aria-live="polite"`)

**Visual Design:**

**Standard Mode Icon:**
```
┌──────────────────┐
│  👁️  Visibility  │  ← Tooltip
│  [Icon]          │  ← Button (44px × 44px)
└──────────────────┘
```

**High-Vis Mode Icon:**
```
┌──────────────────────┐
│  ✓  High Visibility  │  ← Tooltip
│  [Icon with check]   │  ← Button (52px × 52px)
└──────────────────────┘
```

**Accessibility Features:**
- **Keyboard:** Accessible via Tab navigation, activated with Enter/Space
- **Screen Reader:** Announces "Accessibility mode toggle, currently <mode>"
- **Focus Indicator:** 2px solid outline, 2px offset (Info Azure color)
- **Touch Target:** Meets minimum 44px (52px in high-vis)

**Code Reference:** `frontend/src/components/AccessibilityToggle.tsx`

---

### 4.2 Focus Management

**Requirement:** Visible focus indicators on all interactive elements

**Standard Mode:**
- **Outline:** 2px solid #1D8CD8 (Info Azure)
- **Offset:** 2px from element edge
- **Contrast Ratio:** 4.5:1 against background

**High-Vis Mode:**
- **Outline:** 2px solid #000000 (Black)
- **Offset:** 2px from element edge
- **Contrast Ratio:** 21:1 against white background

**Skip Links:**
- First focusable element on page: "Skip to main content"
- Bypasses navbar, jumps to `<main>` element
- Visible only on keyboard focus

**Modal Focus Trapping:**
- Focus confined to modal when open
- Escape key closes modal and returns focus to trigger
- Tab/Shift+Tab cycles through modal interactive elements only

---

### 4.3 Buttons & Interactive Elements

**Touch Target Sizing:**

| Mode | Minimum Size | Padding | Notes |
|------|--------------|---------|-------|
| Standard | 44px × 44px | 16px V × 24px H | WCAG 2.5.5 Level AAA |
| High-Vis | 52px × 52px | 16px V × 24px H | Exceeds standard for aging users |

**Button Variants:**

**Primary Button (Standard Mode):**
```css
background: #003366 (Deep Navy)
color: #FFFFFF
border: none
padding: 16px × 24px
border-radius: 8px
min-height: 44px
font-weight: 600
```

**Primary Button (High-Vis Mode):**
```css
background: #003366 (Deep Navy)
color: #FFFFFF
border: 2px solid #000000
padding: 16px × 24px
border-radius: 4px
min-height: 52px
font-weight: 600
```

**State Indicators:**
- **Hover:** Background lightens 10%
- **Active:** Background darkens 5%
- **Disabled:** 50% opacity + `cursor: not-allowed`
- **Focus:** 2px outline (see Focus Management)

**Multi-Modal Feedback:**
- **Visual:** State-based styling (color, border, shadow)
- **Auditory:** Screen reader announces state changes
- **Tactile:** Cursor changes (pointer, not-allowed)

---

### 4.4 Forms & Inputs

**Input Field Specifications:**

| Mode | Height | Border | Font Size | Label Spacing |
|------|--------|--------|-----------|---------------|
| Standard | 48px | 1px solid #4A4A4A | 16px | 4px above input |
| High-Vis | 56px | 2px solid #000000 | 19.52px | 8px above input |

**Validation States:**

**Error State:**
- **Border:** 2px solid #B3261E (Brick Red)
- **Icon:** ❌ (adjacent to input, not inside)
- **Message:** Red text below input, `aria-live="assertive"`
- **Focus:** Red outline (2px solid #B3261E)

**Success State:**
- **Border:** 1px solid #34A853 (Pine Green)
- **Icon:** ✓ (adjacent to input)
- **Message:** Green text below input, `aria-live="polite"`

**Label Association:**
- All inputs have `<label>` with matching `for` attribute
- Placeholder text ≠ label (never omit labels)
- Helper text uses `aria-describedby` linkage

**Accessible Placeholders:**
```html
<label for="email">Email Address</label>
<input
  id="email"
  type="email"
  placeholder="example@domain.com"
  aria-describedby="email-help"
  aria-required="true"
/>
<small id="email-help">We'll never share your email with third parties.</small>
```

---

### 4.5 Data Tables

**Table Accessibility Requirements:**

**Semantic Structure:**
```html
<table role="table">
  <caption>Vendor Directory Listings</caption>
  <thead>
    <tr>
      <th scope="col">Vendor Name</th>
      <th scope="col">Category</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">ABC Plumbing</th>
      <td>Plumbing</td>
      <td>Approved</td>
    </tr>
  </tbody>
</table>
```

**High-Vis Mode Enhancements:**
- **Row Striping:** Alternating white/#F0F0F0 backgrounds
- **Cell Padding:** Increased from 12px to 16px
- **Border:** 2px solid #000000 grid lines
- **Font Size:** 19.52px (vs. 16px standard)

**Responsive Strategy (Mobile):**
- Tables switch to card layout (<600px width)
- Each row becomes a card with label:value pairs
- Screen readers announce card structure via ARIA

---

### 4.6 Modal Dialogs

**Modal Structure:**

**Visual Presentation:**
```
┌─────────────────────────────────────┐
│  [X] Close                          │  ← Close button (52px in high-vis)
│                                     │
│  Modal Title (xl font)              │  ← <h2> heading
│  ─────────────────────────────      │  ← Separator
│                                     │
│  Modal content paragraph...         │  ← Body content
│                                     │
│  [Cancel]  [Confirm]                │  ← Action buttons
└─────────────────────────────────────┘
       ↑
   Backdrop overlay (rgba(0,0,0,0.5) standard, solid #000 high-vis)
```

**Accessibility Features:**

**Focus Trapping:**
- Tab key cycles: Close button → Body links → Cancel → Confirm → Close button
- Shift+Tab reverses order
- Focus never escapes modal while open

**Keyboard Controls:**
- **Escape:** Closes modal, returns focus to trigger
- **Enter:** Activates primary action (Confirm button)
- **Tab/Shift+Tab:** Navigate focusable elements

**ARIA Attributes:**
```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Deletion</h2>
  <p id="modal-description">Are you sure you want to delete this vendor?</p>
  <button type="button" aria-label="Close dialog">X</button>
  <button type="button">Cancel</button>
  <button type="button" class="primary">Confirm</button>
</div>
```

**Screen Reader Announcements:**
- Modal open: "Dialog opened: Confirm Deletion"
- Modal close: "Dialog closed"
- Focus return: Screen reader moves to original trigger element

---

### 4.7 Loading States & Skeleton Loaders

**Purpose:** Provide visual feedback during async operations without jarring users

**Standard Mode:**
- **Animation:** Shimmer effect (gradient sliding left-to-right)
- **Duration:** 1.5s loop, `ease-in-out` easing
- **Colors:** #E0E6ED base, #F5F7FA highlight
- **Border Radius:** 8px

**High-Vis Mode:**
- **Animation:** Disabled (respects `prefers-reduced-motion`)
- **Pattern:** Alternating horizontal stripes (12px height)
- **Colors:** #000000 stripes on #FFFFFF background
- **Border Radius:** 4px

**Accessibility Considerations:**
- **ARIA:** `aria-busy="true"` on loading containers
- **Screen Reader:** "Loading content, please wait" announcement
- **Timeout:** If loading >10 seconds, display timeout message with retry option

---

### 4.8 Notifications & Alerts

**Toast Notification Specifications:**

**Visual Design (Standard Mode):**
```
┌───────────────────────────────────┐
│  ✓  Success Message               │  ← Icon + Text
│  Additional details...             │
│                              [X]   │  ← Dismiss button
└───────────────────────────────────┘
```

**High-Vis Mode Enhancements:**
- **Border:** 3px solid #000000
- **Icon Size:** 28px (vs. 24px standard)
- **Font Size:** 19.52px body text
- **Dismiss Button:** 52px × 52px

**Severity Levels:**

| Type | Background | Border | Icon | ARIA Role |
|------|------------|--------|------|-----------|
| Success | #1E7344 | #34A853 | ✓ | `status` |
| Warning | #E37400 | #FFB347 | ⚠️ | `alert` |
| Error | #B3261E | #B3261E | ❌ | `alert` |
| Info | #1D8CD8 | #4FB3FF | ℹ️ | `status` |

**Screen Reader Behavior:**
- **Success/Info:** `aria-live="polite"` (waits for current task)
- **Warning/Error:** `aria-live="assertive"` (interrupts immediately)
- **Auto-Dismiss:** Configurable timeout (default: 5s success, 10s error, never for critical errors)

---

## 5. User Journeys

### 5.1 First-Time User Accessibility Discovery

**Persona:** Low-vision user visiting site for first time

**Journey:**
1. **Arrival:** User navigates to homepage via screen reader
2. **Skip Link:** Screen reader announces "Skip to main content" (first tab stop)
3. **Navbar:** User tabs to accessibility toggle (icon + label announced)
4. **Activation:** User presses Enter to toggle high-vis mode
5. **Confirmation:** Screen reader announces "High-visibility mode enabled"
6. **Visual Feedback:** Page re-renders with high-contrast theme
7. **Persistence:** Preference saved to `localStorage`
8. **Return Visit:** User returns next day, high-vis mode auto-applied

**Success Criteria:**
- User discovers toggle within 3 tab stops
- Mode change completes in <500ms
- No page reload required
- Preference persists across sessions

---

### 5.2 Keyboard-Only Navigation

**Persona:** Motor-impaired user (cannot use mouse)

**Journey:**
1. **Login Page:** User tabs to email input (first focus)
2. **Form Completion:** Tab through email → password → "Remember me" checkbox → Login button
3. **Form Submission:** Press Enter on Login button
4. **Dashboard:** Skip link bypasses navbar, lands in main content
5. **Vendor Search:** Tab to search input, type query, press Enter
6. **Results Navigation:** Tab through vendor cards, Enter to view details
7. **Modal Interaction:** Vendor details open in modal, focus trapped inside
8. **Modal Close:** Press Escape, focus returns to vendor card
9. **Logout:** Tab to navbar, navigate to user menu, press Enter on Logout

**Success Criteria:**
- All functionality accessible via keyboard alone
- Focus indicators always visible (2px solid outline)
- Tab order follows visual layout (top-to-bottom, left-to-right)
- No keyboard traps (except intentional modal focus management)

---

### 5.3 Screen Reader Poll Voting

**Persona:** Blind user using NVDA screen reader

**Journey:**
1. **Polls Page:** Screen reader announces "Polls, region, 3 polls available"
2. **Poll Selection:** Arrow keys navigate poll list, Enter to expand poll details
3. **Poll Details:** Screen reader reads title, description, options, deadline
4. **Vote Casting:** Tab to radio button group, arrow keys select option
5. **Submit Vote:** Tab to "Submit Vote" button, press Enter
6. **Confirmation:** Screen reader announces "Vote submitted successfully, your receipt code is: XYZ123"
7. **Receipt Display:** User tabs to receipt code (copyable text), Ctrl+C to copy
8. **Results (If Public):** Screen reader announces "Poll results, Option A: 45%, Option B: 55%"

**Success Criteria:**
- All poll information conveyed via screen reader
- Radio button group uses `role="radiogroup"` with `aria-labelledby`
- Vote submission provides auditory confirmation (`aria-live="assertive"`)
- Receipt code copyable via keyboard (Ctrl+C)

---

## 6. Testing & Validation

### 6.1 Automated Testing

**Tools:**
- **axe-core:** WCAG 2.1 AA automated scans (CI/CD integrated)
- **Vitest + React Testing Library:** Component accessibility tests
- **Lighthouse CI:** Performance + accessibility scoring (target: 95+)

**CI/CD Integration:**
```bash
# Frontend accessibility tests
npm run test -- src/tests/*.a11y.test.tsx

# Expected output: All tests passed, 0 violations detected
```

**Coverage:**
- All interactive components (buttons, forms, modals)
- Color contrast ratios (automated via axe)
- ARIA attribute validation
- Keyboard navigation (focus management)

**Automated Test Example:**
```typescript
// frontend/src/tests/AccessibilityToggle.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessibilityToggle from '@/components/AccessibilityToggle';

expect.extend(toHaveNoViolations);

test('AccessibilityToggle has no WCAG violations', async () => {
  const { container } = render(<AccessibilityToggle />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

### 6.2 Manual Testing

**Screen Reader Testing:**

| Platform | Screen Reader | Test Frequency | Tester |
|----------|---------------|----------------|--------|
| Windows | NVDA (free) | Every major release | Frontend Lead |
| macOS | VoiceOver (built-in) | Every major release | QA Team |
| Android | TalkBack (built-in) | Quarterly | External tester |
| iOS | VoiceOver (built-in) | Quarterly | External tester |

**Testing Checklist:**
- [ ] All interactive elements announced with role and state
- [ ] Form labels read before input values
- [ ] Error messages announced assertively
- [ ] Modal dialogs trap focus correctly
- [ ] Skip links bypass navigation
- [ ] Dynamic content changes announced via `aria-live`

**Keyboard Navigation Testing:**

**Test Scenarios:**
- [ ] Tab order matches visual layout
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators always visible (2px solid outline)
- [ ] Escape key closes modals and menus
- [ ] Enter/Space activate buttons and links
- [ ] Arrow keys navigate radio groups and dropdown menus

**Color Blindness Testing:**

**Tools:**
- **Browser Extensions:** ColorBlindly (Chrome), NoCoffee Vision Simulator
- **Simulators:** Protanopia, Deuteranopia, Tritanopia filters

**Validation:**
- [ ] Success/error states distinguishable without color (icons + text)
- [ ] Chart data uses patterns + colors (not color alone)
- [ ] Link text underlined (not just colored differently)

---

### 6.3 User Acceptance Testing

**Pilot Testing:**
- Recruit 5-10 users with diverse abilities (low vision, motor impairments, aging users)
- Provide compensated testing sessions (1 hour each)
- Test core workflows (registration, login, vendor search, poll voting)

**Feedback Collection:**
- **SUS Survey:** System Usability Scale (target: >68 score)
- **Open-Ended Questions:** "What accessibility features did you find most helpful?"
- **Task Completion Rate:** Track success rate for key tasks

**Iteration:**
- Address all critical accessibility bugs (WCAG violations, keyboard traps)
- Prioritize high-impact improvements (font size, contrast, focus indicators)
- Re-test with pilot users after fixes deployed

---

## 7. Implementation Status

### 7.1 Completed Features (Iteration 2-5)

- [x] **Accessibility Context:** React context provider for theme mode management
- [x] **Theme Tokens:** Complete standard/high-vis token specifications
- [x] **Accessibility Toggle:** Navbar widget with persistent preferences
- [x] **High-Contrast Theme:** Black/white palette with 21:1 contrast ratio
- [x] **Font Scaling:** 22% larger fonts in high-vis mode
- [x] **Touch Targets:** 52px minimum in high-vis mode
- [x] **Focus Indicators:** 2px solid outlines on all interactive elements
- [x] **Skip Links:** "Skip to main content" first tab stop
- [x] **Modal Focus Trapping:** Focus confined to open modals
- [x] **ARIA Labels:** Semantic HTML + ARIA attributes on all components
- [x] **Keyboard Navigation:** All features accessible via keyboard
- [x] **Reduced Motion:** Respects `prefers-reduced-motion` OS setting
- [x] **Screen Reader Testing:** NVDA + VoiceOver validation
- [x] **Automated Tests:** axe-core integration in CI/CD
- [x] **Lighthouse Scoring:** 95+ accessibility score

### 7.2 Documentation Deliverables

- [x] **Design Tokens Spec:** [accessibility-theme-tokens.md](./accessibility-theme-tokens.md)
- [x] **Implementation Guide:** This document
- [x] **Component Tests:** `frontend/src/tests/*.a11y.test.tsx`
- [x] **User Guides:** Accessibility features section in README

---

## 8. Future Enhancements

### 8.1 Planned Features (Iteration 6+)

**Font Size Scaling Control:**
- User-adjustable font size slider (75% - 150% of base)
- Independent of high-vis mode toggle
- Persistent preference via `localStorage`

**Screen Reader Mode Detection:**
- Detect `screen-reader` CSS media query support
- Auto-optimize UI for screen reader users (e.g., disable decorative animations)

**Voice Control Integration:**
- Explore integration with browser voice commands
- Custom voice command mappings for common actions

**Multilingual Support (i18n):**
- Translate UI strings to Spanish (high priority for community)
- Right-to-left (RTL) layout support for future languages

### 8.2 Continuous Improvement

**Quarterly Accessibility Audits:**
- External audit by certified WCAG 2.1 auditor
- Address all Level AA violations within 30 days
- Strive for Level AAA conformance where feasible

**User Feedback Loop:**
- Dedicated accessibility feedback form in footer
- Monthly review of accessibility-related support tickets
- Annual survey of users with disabilities

**Team Training:**
- Quarterly accessibility training for frontend developers
- WCAG 2.1 certification for lead developers
- Screen reader usage workshops

---

## 9. Compliance & Standards

### 9.1 WCAG 2.1 Conformance

**Target Level:** AA (all Level A and AA criteria met)

**Key Criteria Addressed:**

| Guideline | Criteria | Level | Status | Notes |
|-----------|----------|-------|--------|-------|
| Perceivable | 1.4.3 Contrast (Minimum) | AA | ✅ Pass | 21:1 ratio in high-vis |
| Perceivable | 1.4.6 Contrast (Enhanced) | AAA | ✅ Pass | Exceeds 7:1 requirement |
| Operable | 2.1.1 Keyboard | A | ✅ Pass | All functionality keyboard-accessible |
| Operable | 2.4.7 Focus Visible | AA | ✅ Pass | 2px solid outlines |
| Operable | 2.5.5 Target Size | AAA | ✅ Pass | 52px targets in high-vis |
| Understandable | 3.3.2 Labels or Instructions | A | ✅ Pass | All inputs labeled |
| Robust | 4.1.2 Name, Role, Value | A | ✅ Pass | ARIA attributes validated |

**Conformance Report:** Available in `docs/compliance/wcag-2.1-report.pdf` (generated via axe DevTools)

### 9.2 Legal & Regulatory Compliance

**ADA Title III (Americans with Disabilities Act):**
- Web accessibility required for public accommodations
- HOA community website qualifies as place of public accommodation

**Section 508 (Rehabilitation Act):**
- Not directly applicable (HOA is private entity)
- However, adhering to Section 508 standards ensures broad compliance

**State Accessibility Laws:**
- Vary by state; consult local counsel for specific requirements
- WCAG 2.1 AA conformance generally sufficient

---

## 10. Resources & References

### 10.1 External Standards

- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **WebAIM:** https://webaim.org/ (contrast checker, guides)

### 10.2 Tools & Libraries

- **axe-core:** https://github.com/dequelabs/axe-core
- **React Testing Library:** https://testing-library.com/react
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse
- **NVDA Screen Reader:** https://www.nvaccess.org/

### 10.3 Internal Documentation

- [Accessibility Theme Tokens](./accessibility-theme-tokens.md)
- [UI/UX Architecture](../../.codemachine/artifacts/architecture/06_UI_UX_Architecture.md)
- [Frontend Test Suite](../../frontend/src/tests/)
- [Accessibility Context Code](../../frontend/src/contexts/AccessibilityContext.tsx)

---

## 11. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-23 | DocumentationAgent | Initial comprehensive accessibility suite documentation for I5 knowledge transfer |

---

## 12. Sign-Off

**Acceptance Criteria Verified:**

- [x] Design principles documented with rationale
- [x] Standard and high-vis modes specified with contrast ratios
- [x] Component specifications include ARIA patterns
- [x] User journeys validate real-world scenarios
- [x] Testing procedures cover automated + manual methods
- [x] Implementation status reflects Iteration 5 deliverables
- [x] Future enhancements roadmap provided
- [x] WCAG 2.1 AA conformance documented
- [x] Cross-references to architecture and code provided

**Approvals:**

- **Frontend Lead:** ______________________________ (Signature, Date)
- **QA Lead:** ______________________________ (Signature, Date)
- **Product Owner:** ______________________________ (Signature, Date)

---

**End of Document**

For questions or clarifications, contact Frontend Team at <frontend-team-email> or file issue with label `accessibility`.
