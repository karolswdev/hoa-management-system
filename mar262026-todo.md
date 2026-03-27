# Architectural Review Feature - Progress & Remaining Work
**Date:** March 26, 2026

---

## Completed

### Requirements & Architecture
- [x] MVP SRS with 33 functional requirements, 7 security, data model, API endpoints, state machine
- [x] Mid-maturity and target SRS tiers
- [x] ICD (Interface Control Document) with full request/response contracts
- [x] 8 open questions resolved with stakeholder
- [x] Traceability matrix (requirements -> implementation)
- [x] Test traceability matrix (requirements -> verification)
- [x] Glossary
- [x] 8 ADRs covering three-layer decomposition, polymorphic workflow, committee auth, per-committee expiration, lazy expiration, state machine design, separate attachments, SQLite constraints

### Backend - Database
- [x] 8 migrations: committees, committee_members, arc_categories, arc_requests, workflow_instances, workflow_transitions, workflow_comments, workflow_attachments
- [x] All migrations run successfully
- [x] Seeder: default "Architectural Review" committee + 9 ARC categories (Fence, Paint/Exterior Color, Landscaping, Roofing, Deck/Patio, Shed/Outbuilding, Solar Panels, Signage, Other)

### Backend - Models
- [x] 8 Sequelize models with associations: Committee, CommitteeMember, ArcCategory, ArcRequest, WorkflowInstance, WorkflowTransition, WorkflowComment, WorkflowAttachment

### Backend - Services
- [x] `committee.service.js` - Committee CRUD, membership management, audit logging
- [x] `workflow.service.js` - Reusable state machine engine (11 statuses, strict transitions), comments, attachments, lazy expiration, polymorphic request support
- [x] `arcRequest.service.js` - ARC domain logic, auto-creates workflow on submit, category CRUD
- [x] `workflowEmail.service.js` - Email notifications for submission, status changes, comments, appeals, withdrawals

### Backend - Middleware
- [x] `committee.middleware.js` - `authorizeCommitteeMember` (no admin bypass) + `authorizeSubmitterOrCommitteeMember`
- [x] `workflowUpload.middleware.js` - Multer config for workflow attachments (separate `uploads/workflows/` directory)

### Backend - Controllers
- [x] `committee.controller.js` - 7 endpoints
- [x] `workflow.controller.js` - 6 endpoints
- [x] `arcRequest.controller.js` - 4 endpoints
- [x] `arcCategory.controller.js` - 4 endpoints

### Backend - Routes
- [x] `committee.routes.js`, `workflow.routes.js`, `arcRequest.routes.js`, `arcCategory.routes.js`
- [x] All 4 route groups registered in `app.js`

### Backend - Integration Tests (74 tests, all passing)
- [x] `committee.test.js` - 23 tests (CRUD, membership, auth, edge cases)
- [x] `workflow.test.js` - 31 tests (state machine, no-admin-bypass, appeals, comments, attachments, expiration)
- [x] `arcRequest.test.js` - 20 tests (categories, requests, role-based listing, full lifecycle)

### Bug Fixes During Implementation
- [x] SQLite BUSY: moved audit logging outside Sequelize transactions
- [x] Internal comment filtering: fixed Sequelize `dataValues` serialization
- [x] Lazy expiration: fixed status capture before mutation

---

## Remaining Work

### Frontend - Pages
- [x] Committee management page (admin) - create/edit committees, manage members
- [x] ARC request submission page (member) - form with category dropdown, address, description, file upload
- [x] ARC request list page (member) - own requests with status badges
- [x] ARC request list page (committee member) - queue of requests assigned to their committee
- [x] ARC request detail page - full timeline, comments, attachments, transition actions
- [x] ARC category management page (admin) - CRUD for categories
- [x] Committee roster view (member) - view committee members (visible in committee management expand)

### Frontend - Components
- [x] Workflow status badge component (color-coded by status)
- [x] Workflow timeline component (transitions displayed chronologically)
- [x] Comment thread component (with internal comment toggle for committee members)
- [x] File attachment upload/display component
- [x] Transition action buttons (context-aware based on current status and user role)
- [x] ARC request form (Formik + Yup validation)

### Frontend - Navigation & Routing
- [x] Add ARC / Committees routes to React Router
- [x] Add sidebar/nav links for ARC requests and committee management
- [x] Role-based nav visibility (admin sees committee management, members see submit request)

### Frontend - API Integration
- [x] API client functions for all 21 backend endpoints (committees, workflows, arc-requests, arc-categories)
- [x] React Query hooks for data fetching and caching

### Frontend - Tests
- [x] Vitest unit tests for new components (58 new tests, 345 total passing)
- [x] Playwright E2E tests for ARC request lifecycle (22 tests in arc-requests.spec.ts)
- [x] Accessibility (axe-core) tests for new pages

### Documentation
- [x] Update API overview docs with new endpoints (ICD covers this in docs/requirements/arc/system/common/ICD.md)
- [x] Update user guide with ARC request instructions (MEMBER_USER_GUIDE.md v1.2, ADMIN_USER_GUIDE.md v1.2)
- [x] Update deployment runbook with new migrations and seeds (migrations auto-detected by existing pipeline; seed script updated with ARC data)

### Nice-to-Have (Not Blocking)
- [ ] Expiration warning email (7 days before expiry) - backend template exists, needs trigger
- [ ] Dashboard widget showing pending ARC requests for committee members
- [ ] Search/filter on ARC request lists (by status, category, date range)
