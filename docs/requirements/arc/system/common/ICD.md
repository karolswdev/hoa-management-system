# Interface Control Document (ICD)

## 1. Overview

This document defines all interfaces, contracts, and integration points for the Committees, Approval Workflow Engine, and ARC Request features. It is tier-agnostic -- all tiers reference these canonical definitions.

---

## 2. API Contracts

### 2.1 Committee API

#### POST /api/committees
<a id="icd-committee-create"></a>

**Request:**
```json
{
  "name": "Architectural Review",
  "description": "Reviews exterior modification requests"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Architectural Review",
  "description": "Reviews exterior modification requests",
  "status": "active",
  "created_at": "2026-03-26T00:00:00.000Z",
  "updated_at": "2026-03-26T00:00:00.000Z"
}
```

**Errors:**
- 400: Validation error (name required, name already exists)
- 401: Not authenticated
- 403: Not admin

#### GET /api/committees
<a id="icd-committee-list"></a>

**Query Parameters:**
- `status` (optional): 'active' | 'inactive' | 'all'. Default: 'active'.
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Architectural Review",
      "description": "Reviews exterior modification requests",
      "status": "active",
      "memberCount": 3,
      "created_at": "2026-03-26T00:00:00.000Z"
    }
  ],
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 20
  }
}
```

#### GET /api/committees/:id
<a id="icd-committee-detail"></a>

**Response (200):**
```json
{
  "id": 1,
  "name": "Architectural Review",
  "description": "Reviews exterior modification requests",
  "status": "active",
  "members": [
    {
      "id": 1,
      "userId": 5,
      "userName": "John Smith",
      "role": "chair",
      "appointed_at": "2026-03-26T00:00:00.000Z"
    },
    {
      "id": 2,
      "userId": 8,
      "userName": "Jane Doe",
      "role": "member",
      "appointed_at": "2026-03-26T00:00:00.000Z"
    }
  ],
  "created_at": "2026-03-26T00:00:00.000Z",
  "updated_at": "2026-03-26T00:00:00.000Z"
}
```

#### PUT /api/committees/:id
<a id="icd-committee-update"></a>

**Request:**
```json
{
  "name": "ARC",
  "description": "Updated description",
  "status": "inactive"
}
```

All fields optional. At least one required.

**Response (200):** Updated committee object.

#### DELETE /api/committees/:id
<a id="icd-committee-delete"></a>

Soft-deactivates the committee (sets status to 'inactive').

**Response (200):**
```json
{ "message": "Committee deactivated." }
```

#### POST /api/committees/:id/members
<a id="icd-committee-add-member"></a>

**Request:**
```json
{
  "userId": 5,
  "role": "chair"
}
```

`role` is optional, defaults to `"member"`. Valid values: `"member"`, `"chair"`.

**Response (201):**
```json
{
  "id": 1,
  "committeeId": 1,
  "userId": 5,
  "userName": "John Smith",
  "role": "chair",
  "appointed_at": "2026-03-26T00:00:00.000Z"
}
```

**Errors:**
- 400: User already a member of this committee
- 404: User not found or committee not found

#### DELETE /api/committees/:id/members/:userId
<a id="icd-committee-remove-member"></a>

**Response (200):**
```json
{ "message": "Member removed from committee." }
```

---

### 2.2 Workflow API

#### GET /api/workflows
<a id="icd-workflow-list"></a>

**Query Parameters:**
- `status` (optional): Filter by workflow status
- `committeeId` (optional): Filter by committee
- `requestType` (optional): Filter by domain type (e.g., 'arc_request')
- `submittedBy` (optional): Filter by submitter user ID (admin only)
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `sortBy` (optional): 'created_at' | 'updated_at'. Default: 'updated_at'.
- `sortOrder` (optional): 'ASC' | 'DESC'. Default: 'DESC'.

**Authorization logic:**
- Members see only their own submitted workflows.
- Committee members additionally see workflows assigned to their committee(s).
- Admins see all workflows.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "committeeId": 1,
      "committeeName": "Architectural Review",
      "requestType": "arc_request",
      "requestId": 1,
      "status": "under_review",
      "submittedBy": { "id": 3, "name": "Resident Name" },
      "expiresAt": null,
      "created_at": "2026-03-26T00:00:00.000Z",
      "updated_at": "2026-03-26T00:00:00.000Z"
    }
  ],
  "pagination": { "totalItems": 1, "totalPages": 1, "currentPage": 1, "limit": 20 }
}
```

#### GET /api/workflows/:id
<a id="icd-workflow-detail"></a>

**Response (200):**
```json
{
  "id": 1,
  "committeeId": 1,
  "committeeName": "Architectural Review",
  "requestType": "arc_request",
  "requestId": 1,
  "status": "under_review",
  "submittedBy": { "id": 3, "name": "Resident Name" },
  "expiresAt": null,
  "appealCount": 0,
  "transitions": [
    {
      "id": 1,
      "fromStatus": "draft",
      "toStatus": "submitted",
      "performedBy": { "id": 3, "name": "Resident Name" },
      "comment": null,
      "created_at": "2026-03-26T00:00:00.000Z"
    },
    {
      "id": 2,
      "fromStatus": "submitted",
      "toStatus": "under_review",
      "performedBy": { "id": 5, "name": "Committee Member" },
      "comment": "Beginning review",
      "created_at": "2026-03-26T01:00:00.000Z"
    }
  ],
  "comments": [
    {
      "id": 1,
      "userId": 5,
      "userName": "Committee Member",
      "content": "Looks good, need to verify setback requirements.",
      "isInternal": false,
      "created_at": "2026-03-26T01:30:00.000Z"
    }
  ],
  "attachments": [
    {
      "id": 1,
      "uploadedBy": { "id": 3, "name": "Resident Name" },
      "originalFileName": "fence-plan.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1048576,
      "created_at": "2026-03-26T00:00:00.000Z"
    }
  ],
  "created_at": "2026-03-26T00:00:00.000Z",
  "updated_at": "2026-03-26T01:30:00.000Z"
}
```

**Note:** Internal comments (`isInternal: true`) MUST be filtered out for non-committee-member, non-admin requesters.

#### POST /api/workflows/:id/transitions
<a id="icd-workflow-transition"></a>

**Request:**
```json
{
  "toStatus": "approved",
  "comment": "Approved per community guidelines section 4.2"
}
```

`comment` is optional.

**Response (200):**
```json
{
  "id": 3,
  "workflowId": 1,
  "fromStatus": "under_review",
  "toStatus": "approved",
  "performedBy": { "id": 5, "name": "Committee Member" },
  "comment": "Approved per community guidelines section 4.2",
  "created_at": "2026-03-26T02:00:00.000Z"
}
```

**Errors:**
- 400: Invalid transition (from current status to requested status)
- 403: User not authorized to perform this transition

#### POST /api/workflows/:id/comments
<a id="icd-workflow-comment"></a>

**Request:**
```json
{
  "content": "Please provide a photo of the proposed paint color.",
  "isInternal": false
}
```

`isInternal` defaults to `false`. Only committee members and admins may set `isInternal: true`.

**Response (201):**
```json
{
  "id": 2,
  "workflowId": 1,
  "userId": 5,
  "userName": "Committee Member",
  "content": "Please provide a photo of the proposed paint color.",
  "isInternal": false,
  "created_at": "2026-03-26T02:30:00.000Z"
}
```

#### POST /api/workflows/:id/attachments
<a id="icd-workflow-attachment"></a>

**Request:** `multipart/form-data`
- `file`: The file (max 10MB, allowed types per upload middleware config)

**Response (201):**
```json
{
  "id": 2,
  "workflowId": 1,
  "uploadedBy": { "id": 3, "name": "Resident Name" },
  "originalFileName": "paint-sample.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 524288,
  "created_at": "2026-03-26T03:00:00.000Z"
}
```

**Constraints:**
- Max 5 attachments per upload request
- Max 10MB per file
- Total attachments per workflow instance: 20 (configurable)

#### GET /api/workflows/:id/attachments/:attachmentId/download
<a id="icd-workflow-attachment-download"></a>

**Response (200):** File stream with appropriate `Content-Type` and `Content-Disposition` headers.

---

### 2.3 ARC Request API

#### POST /api/arc-requests
<a id="icd-arc-create"></a>

**Request:** `multipart/form-data`
- `propertyAddress` (string, required)
- `categoryId` (integer, required)
- `description` (string, required)
- `files` (file[], optional, max 5 files, max 10MB each)
- `submitImmediately` (boolean, optional, default: true) -- if true, auto-transitions from draft to submitted

**Response (201):**
```json
{
  "id": 1,
  "submitterId": 3,
  "propertyAddress": "123 Sanderson Creek Dr",
  "categoryId": 1,
  "categoryName": "Fence",
  "description": "Requesting approval to install a 6ft cedar privacy fence along the rear property line.",
  "workflowId": 1,
  "workflowStatus": "submitted",
  "created_at": "2026-03-26T00:00:00.000Z",
  "updated_at": "2026-03-26T00:00:00.000Z"
}
```

**Side effects:**
1. Creates an `arc_requests` row.
2. Creates a `workflow_instances` row linked to the ARC committee.
3. Creates `workflow_attachments` for any uploaded files.
4. If `submitImmediately`, creates a transition from `draft` to `submitted`.
5. Sends email notification to committee members.
6. Creates audit log entry.

#### GET /api/arc-requests
<a id="icd-arc-list"></a>

**Query Parameters:**
- `status` (optional): Filter by workflow status
- `categoryId` (optional): Filter by ARC category
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `sortBy` (optional): 'created_at' | 'updated_at'. Default: 'updated_at'.
- `sortOrder` (optional): 'ASC' | 'DESC'. Default: 'DESC'.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "submitter": { "id": 3, "name": "Resident Name" },
      "propertyAddress": "123 Sanderson Creek Dr",
      "categoryName": "Fence",
      "description": "Requesting approval to install a 6ft cedar privacy fence...",
      "workflowId": 1,
      "workflowStatus": "submitted",
      "created_at": "2026-03-26T00:00:00.000Z",
      "updated_at": "2026-03-26T00:00:00.000Z"
    }
  ],
  "pagination": { "totalItems": 1, "totalPages": 1, "currentPage": 1, "limit": 20 }
}
```

#### GET /api/arc-requests/:id
<a id="icd-arc-detail"></a>

**Response (200):** Full ARC request with embedded workflow detail (transitions, comments, attachments).

```json
{
  "id": 1,
  "submitter": { "id": 3, "name": "Resident Name" },
  "propertyAddress": "123 Sanderson Creek Dr",
  "category": { "id": 1, "name": "Fence" },
  "description": "Requesting approval to install a 6ft cedar privacy fence...",
  "workflow": {
    "id": 1,
    "status": "under_review",
    "expiresAt": null,
    "transitions": [ "..." ],
    "comments": [ "..." ],
    "attachments": [ "..." ]
  },
  "created_at": "2026-03-26T00:00:00.000Z",
  "updated_at": "2026-03-26T00:00:00.000Z"
}
```

#### PUT /api/arc-requests/:id
<a id="icd-arc-update"></a>

Only allowed when workflow status is `draft`.

**Request:**
```json
{
  "propertyAddress": "456 Sanderson Creek Dr",
  "categoryId": 2,
  "description": "Updated description"
}
```

All fields optional. At least one required.

**Response (200):** Updated ARC request object.

---

### 2.4 ARC Category API

#### GET /api/arc-categories
<a id="icd-arc-categories-list"></a>

**Response (200):**
```json
{
  "data": [
    { "id": 1, "name": "Fence", "description": null, "isActive": true, "sortOrder": 1 },
    { "id": 2, "name": "Paint/Exterior Color", "description": null, "isActive": true, "sortOrder": 2 }
  ]
}
```

#### POST /api/arc-categories
<a id="icd-arc-categories-create"></a>

**Request:**
```json
{
  "name": "Solar Panels",
  "description": "Rooftop or ground-mounted solar installations",
  "sortOrder": 7
}
```

**Response (201):** Created category object.

#### PUT /api/arc-categories/:id
<a id="icd-arc-categories-update"></a>

**Request:**
```json
{
  "name": "Updated Name",
  "isActive": false
}
```

**Response (200):** Updated category object.

#### DELETE /api/arc-categories/:id
<a id="icd-arc-categories-delete"></a>

Soft-deactivates the category (sets `is_active` to false). Categories with existing requests MUST NOT be hard-deleted.

**Response (200):**
```json
{ "message": "Category deactivated." }
```

---

## 3. Internal Service Interfaces

### 3.1 Workflow Service Interface

The `workflow.service.js` module exposes the following internal functions:

```javascript
// Create a new workflow instance
async function createWorkflow({ committeeId, requestType, requestId, submittedBy, expiresAt? })
  -> returns WorkflowInstance

// Perform a status transition
async function transitionWorkflow({ workflowId, toStatus, performedBy, comment? })
  -> returns WorkflowTransition
  -> throws InvalidTransitionError if transition is not valid

// Add a comment
async function addComment({ workflowId, userId, content, isInternal? })
  -> returns WorkflowComment

// Add an attachment
async function addAttachment({ workflowId, uploadedBy, fileData })
  -> returns WorkflowAttachment

// Get workflow with full history
async function getWorkflowDetail(workflowId)
  -> returns { instance, transitions, comments, attachments }

// List workflows with filters
async function listWorkflows({ filters, pagination, requestingUserId, userRole, userCommitteeIds })
  -> returns { data, pagination }

// Check if a transition is valid
function isValidTransition(fromStatus, toStatus)
  -> returns boolean

// Get valid next statuses
function getValidTransitions(currentStatus, userRelation)
  -> returns string[]
  // userRelation: 'submitter' | 'committee_member' | 'admin'
```

### 3.2 Committee Service Interface

```javascript
// Check if user is a member of the given committee
async function isCommitteeMember(userId, committeeId)
  -> returns boolean

// Check if user is chair of the given committee
async function isCommitteeChair(userId, committeeId)
  -> returns boolean

// Get all committee IDs a user belongs to
async function getUserCommitteeIds(userId)
  -> returns number[]

// Get all members of a committee (for notifications)
async function getCommitteeMembers(committeeId)
  -> returns Array<{ id, userId, userName, userEmail, role }>
```

---

## 4. Email Notification Contracts

### 4.1 Templates

| Template ID | Subject Pattern | Recipients | Trigger |
|-------------|----------------|------------|---------|
| `arc-request-submitted` | "New ARC Request: {category} at {address}" | Committee members | Workflow transitions to `submitted` |
| `workflow-status-changed` | "Request Update: {status} - {requestSummary}" | Submitter | Any status transition (except to `submitted`) |
| `workflow-comment-added` | "New Comment on Your Request: {requestSummary}" | Submitter (if commenter is committee) or Committee (if commenter is submitter) | Comment created |
| `workflow-appeal-filed` | "Appeal Filed: {requestSummary}" | Committee members + admins | Workflow transitions to `appealed` |
| `workflow-expiration-warning` | "Approval Expiring: {requestSummary}" | Submitter | 7 days before expiration (mvp-mid+) |

### 4.2 Email Payload Contract

All workflow emails follow the existing `email.service.js` patterns:

```javascript
{
  to: "recipient@example.com" | process.env.EMAIL_FROM,  // BCC for batches
  bcc: ["list@example.com"],  // For multi-recipient
  subject: "string",
  html: "string",
  text: "string"
}
```

---

## 5. Audit Log Action Types

| Action | Details Schema |
|--------|---------------|
| `committee_created` | `{ committeeId, name }` |
| `committee_updated` | `{ committeeId, changes: { field: { old, new } } }` |
| `committee_deactivated` | `{ committeeId, name }` |
| `committee_member_added` | `{ committeeId, userId, role }` |
| `committee_member_removed` | `{ committeeId, userId }` |
| `arc_request_created` | `{ arcRequestId, workflowId, category, propertyAddress }` |
| `workflow_transition` | `{ workflowId, requestType, requestId, fromStatus, toStatus }` |
| `workflow_comment_added` | `{ workflowId, commentId, isInternal }` |
| `arc_category_created` | `{ categoryId, name }` |
| `arc_category_updated` | `{ categoryId, changes }` |
| `arc_category_deactivated` | `{ categoryId, name }` |

---

## 6. State Machine Definition

### 6.1 Status Enum

```javascript
const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  DENIED: 'denied',
  WITHDRAWN: 'withdrawn',
  APPEALED: 'appealed',
  APPEAL_UNDER_REVIEW: 'appeal_under_review',
  APPEAL_APPROVED: 'appeal_approved',
  APPEAL_DENIED: 'appeal_denied',
  EXPIRED: 'expired'
};
```

### 6.2 Transition Map

```javascript
const VALID_TRANSITIONS = {
  draft:                 ['submitted'],
  submitted:             ['under_review', 'withdrawn'],
  under_review:          ['approved', 'denied', 'withdrawn'],
  approved:              ['expired'],
  denied:                ['appealed'],
  appealed:              ['appeal_under_review'],
  appeal_under_review:   ['appeal_approved', 'appeal_denied'],
  // Terminal states (no outbound transitions):
  withdrawn:             [],
  appeal_approved:       ['expired'],
  appeal_denied:         [],
  expired:               []
};
```

### 6.3 Transition Authorization

```javascript
const TRANSITION_AUTH = {
  'draft->submitted':                      ['submitter'],
  'submitted->under_review':               ['committee_member', 'admin'],
  'submitted->withdrawn':                  ['submitter'],
  'under_review->approved':                ['committee_member', 'admin'],
  'under_review->denied':                  ['committee_member', 'admin'],
  'under_review->withdrawn':               ['submitter'],
  'denied->appealed':                      ['submitter'],
  'appealed->appeal_under_review':         ['committee_member', 'admin'],
  'appeal_under_review->appeal_approved':  ['committee_member', 'admin'],
  'appeal_under_review->appeal_denied':    ['committee_member', 'admin'],
  'approved->expired':                     ['system'],
  'appeal_approved->expired':              ['system']
};
```

---

## 7. Versioning

This ICD is versioned alongside the SRS. Breaking changes to response shapes or endpoint signatures MUST increment the ICD version and include change-impact notes.

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-03-26 | Initial draft |
