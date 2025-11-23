# Democracy Module Documentation

## Overview

The Democracy Module provides poll creation, voting, and hash-chain integrity features for the HOA Management System. It supports both informal and binding polls with optional anonymous voting and cryptographic receipts.

## Architecture

### Components

1. **Models** (`backend/models/`)
   - `poll.model.js` - Poll metadata (title, type, dates, settings)
   - `pollOption.model.js` - Poll answer choices
   - `vote.model.js` - Individual votes with hash chain links
   - `emailAudit.model.js` - Email notification tracking
   - `residentNotificationLog.model.js` - Per-recipient notification logs

2. **Services** (`backend/src/services/`)
   - `democracy.service.js` - Poll CRUD, voting logic, notifications
   - `vote.service.js` - Hash chain operations, receipt verification

3. **Utilities** (`backend/src/utils/`)
   - `hashChain.js` - SHA256 hash computation and chain validation

4. **Controllers** (`backend/src/controllers/`)
   - `poll.controller.js` - REST endpoint handlers

5. **Routes** (`backend/src/routes/`)
   - `poll.routes.js` - API routing with auth/rate-limit middleware

## Hash Chain Integrity

### Formula

Each vote generates a cryptographic hash using SHA256:

```
vote_hash = SHA256(user_id + option_id + timestamp + prev_hash)
```

- **user_id**: Empty string for anonymous votes
- **option_id**: Selected poll option ID
- **timestamp**: ISO 8601 timestamp
- **prev_hash**: Previous vote's hash, or `"GENESIS"` for first vote

### Receipt Generation

Receipt codes are derived from the first 16 characters of the vote hash:

```
receipt_code = vote_hash.substring(0, 16).toUpperCase()
```

### Chain Validation

The `validateHashChain` utility verifies:
1. Each vote's hash matches recomputation
2. Each vote's `prev_hash` matches the previous vote's `vote_hash`
3. First vote has null or `"GENESIS"` prev_hash

## API Endpoints

### Public/Member Endpoints

#### `GET /api/polls`
Get active and scheduled polls.

**Query Parameters:**
- `type` (optional): Filter by poll type (`informal`, `binding`, `straw-poll`)
- `status` (optional): Filter by status (`active`, `scheduled`, `closed`)

**Response:**
```json
{
  "polls": [
    {
      "id": 1,
      "title": "Budget Approval",
      "description": "...",
      "type": "binding",
      "is_anonymous": false,
      "start_at": "2025-01-20T00:00:00Z",
      "end_at": "2025-01-27T23:59:59Z",
      "status": "active",
      "options": [
        {"id": 1, "text": "Approve", "order_index": 0},
        {"id": 2, "text": "Reject", "order_index": 1}
      ],
      "created_by": "Admin User",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 1,
  "serverTime": "2025-01-23T12:00:00Z"
}
```

#### `GET /api/polls/:id`
Get poll details by ID.

**Query Parameters:**
- `include_results` (optional): Include vote counts for closed polls

**Response:**
```json
{
  "poll": {
    "id": 1,
    "title": "Budget Approval",
    "description": "...",
    "type": "binding",
    "is_anonymous": false,
    "start_at": "2025-01-20T00:00:00Z",
    "end_at": "2025-01-27T23:59:59Z",
    "status": "active",
    "options": [...],
    "created_by": "Admin User",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

#### `GET /api/polls/receipts/:code`
Verify a vote receipt.

**Response (Success):**
```json
{
  "message": "Receipt verified",
  "receipt": {
    "poll": {"id": 1, "title": "Budget Approval", "type": "binding"},
    "option": {"id": 1, "text": "Approve"},
    "timestamp": "2025-01-23T12:00:00Z",
    "vote_hash": "a1b2c3...",
    "prev_hash": "d4e5f6...",
    "receipt_code": "A1B2C3D4E5F6G7H8"
  }
}
```

**Response (Not Found):**
```json
{
  "message": "Receipt not found"
}
```

#### `GET /api/polls/:id/results`
Get poll results. Public for closed polls, admin-only for active polls.

**Response:**
```json
{
  "poll": {
    "id": 1,
    "title": "Budget Approval",
    "type": "binding",
    "status": "closed"
  },
  "results": [
    {"option_id": 1, "text": "Approve", "vote_count": 42},
    {"option_id": 2, "text": "Reject", "vote_count": 15}
  ]
}
```

### Member Endpoints

#### `POST /api/polls/:id/votes`
Cast a vote in a poll (requires authentication).

**Request Body:**
```json
{
  "option_id": 1
}
```

**Response:**
```json
{
  "message": "Vote cast successfully",
  "receipt": "A1B2C3D4E5F6G7H8",
  "submitted_at": "2025-01-23T12:00:00Z",
  "integrity": {
    "vote_hash": "a1b2c3d4e5f6...",
    "prev_hash": "d4e5f6g7h8i9..."
  }
}
```

**Error Responses:**
- `400`: Poll not started or already closed, invalid option
- `409`: User already voted in this poll
- `404`: Poll not found

### Admin Endpoints

#### `POST /api/polls`
Create a new poll (admin only).

**Request Body:**
```json
{
  "title": "Budget Approval 2025",
  "description": "Vote on the proposed 2025 community budget",
  "type": "binding",
  "is_anonymous": false,
  "notify_members": true,
  "start_at": "2025-01-20T00:00:00Z",
  "end_at": "2025-01-27T23:59:59Z",
  "options": [
    {"text": "Approve", "order_index": 0},
    {"text": "Reject", "order_index": 1},
    {"text": "Abstain", "order_index": 2}
  ]
}
```

**Response:**
```json
{
  "message": "Poll created successfully",
  "poll": {
    "id": 1,
    "title": "Budget Approval 2025",
    "options": [...]
  }
}
```

**Validations:**
- `title` is required and sanitized (XSS protection)
- `type` must be one of: `informal`, `binding`, `straw-poll`
- `end_at` must be after `start_at`
- At least 2 options required
- Binding polls require `polls.binding-enabled` feature flag

#### `GET /api/polls/:id/integrity`
Validate hash chain integrity (admin only).

**Response:**
```json
{
  "message": "Hash chain validation completed",
  "validation": {
    "valid": true,
    "totalVotes": 57,
    "brokenLinks": [],
    "message": "Hash chain is valid"
  }
}
```

**Broken Chain Example:**
```json
{
  "validation": {
    "valid": false,
    "totalVotes": 57,
    "brokenLinks": [
      {
        "index": 12,
        "voteId": 345,
        "reason": "Hash mismatch - vote data may have been tampered with"
      }
    ],
    "message": "Found 1 integrity issues"
  }
}
```

## Database Schema

### Polls Table
```sql
CREATE TABLE polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  is_anonymous BOOLEAN DEFAULT 0,
  notify_members BOOLEAN DEFAULT 0,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Poll Options Table
```sql
CREATE TABLE poll_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL,
  text VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  UNIQUE (poll_id, order_index)
);
```

### Votes Table
```sql
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL,
  user_id INTEGER,  -- NULL for anonymous votes
  option_id INTEGER NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  prev_hash VARCHAR(255),  -- NULL for first vote
  vote_hash VARCHAR(255) NOT NULL UNIQUE,
  receipt_code VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
);
```

## Transaction Safety

### Voting Transactions

All vote casting uses `BEGIN IMMEDIATE` transactions to ensure serialized access:

```javascript
const transaction = await sequelize.transaction({
  type: sequelize.Sequelize.Transaction.TYPES.IMMEDIATE
});
```

This prevents race conditions when:
1. Fetching the previous vote hash
2. Computing the new vote hash
3. Inserting the new vote record

### Rollback Conditions

Transactions rollback on:
- Poll not found
- Poll not open (before start or after end)
- Invalid option ID
- User already voted (for non-anonymous polls)
- Hash computation errors

## Feature Flags

### `polls.binding-enabled`
- **Type:** Boolean (`"true"` / `"false"`)
- **Purpose:** Enable/disable binding poll creation
- **Default:** `true`

### `polls.notify-members-enabled`
- **Type:** Boolean (`"true"` / `"false"`)
- **Purpose:** Enable/disable email notifications for new polls
- **Default:** `false` (to avoid accidental spam)

## Audit Logging

All poll-related actions are logged via `audit.service.js`:

### Poll Creation
```javascript
await auditService.logAdminAction(adminUserId, 'poll_create', {
  pollId: poll.id,
  title: poll.title,
  type: poll.type,
  optionCount: pollOptions.length
});
```

### Vote Casting
```javascript
await auditService.logAdminAction(userId, 'vote_cast', {
  pollId: poll_id,
  optionId: option_id,
  receiptCode: receipt_code,
  correlationId
});
```

Correlation IDs (UUIDs) are generated per request to trace vote operations across logs.

## Email Notifications

When `notify_members` is true during poll creation:

1. **EmailAudit** record created with:
   - Template: `'poll_notification'`
   - Recipient count
   - SHA256 hash of payload (poll ID + recipient list)
   - Status: `'pending'` → `'sent'` / `'failed'`

2. **ResidentNotificationLog** entries created per recipient:
   - User ID
   - Email audit ID (foreign key)
   - Subject line
   - Sent timestamp
   - Status

3. SendGrid email sent (or logged in dev) with poll details

## Testing

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run poll tests only
npm run test:integration -- poll.test.js
```

### Test Coverage

The test suite (`backend/test/integration/poll.test.js`) covers:

- ✅ Poll creation (admin-only, validation errors)
- ✅ Poll retrieval (list, detail, filtering)
- ✅ Voting (success, duplicate detection, invalid options)
- ✅ Receipt verification (valid/invalid codes)
- ✅ Hash chain integrity validation
- ✅ Anonymous polls (user_id nullability)
- ✅ Poll results (closed polls, admin early access)
- ✅ Authorization checks (member vs admin endpoints)

## Security Considerations

### XSS Prevention
All user-provided strings (`title`, `description`, `option.text`) are sanitized using DOMPurify:

```javascript
const sanitizedTitle = purify.sanitize(title, { ALLOWED_TAGS: [] });
```

### Timing Attack Prevention
Receipt verification returns 404 in constant time for both valid and invalid codes:

```javascript
if (!receipt) {
  return res.status(404).json({ message: 'Receipt not found' });
}
```

### Hash Chain Immutability
- `vote_hash` and `receipt_code` have UNIQUE constraints
- Votes cannot be updated or deleted (CASCADE only on parent poll)
- IMMEDIATE transactions prevent concurrent hash collisions

### Anonymous Voting
- When `is_anonymous: true`, `user_id` is set to `NULL`
- Duplicate vote prevention is disabled for anonymous polls
- Receipt verification never exposes `user_id`

## Future Enhancements

- [ ] WebSocket notifications for real-time vote counts
- [ ] Multi-signature verification for binding polls
- [ ] Vote delegation/proxy voting
- [ ] Poll templates for common scenarios
- [ ] Scheduled poll start/close automation
- [ ] CSV export of poll results
- [ ] Poll amendment/cancellation workflows

## Related Documentation

- [Architecture Blueprint](../../.codemachine/artifacts/architecture/01_Blueprint_Foundation.md)
- [Iteration 3 Plan](../../.codemachine/artifacts/plan/02_Iteration_I3.md)
- [API Routes](./API_ROUTES.md)
- [Database Migrations](../migrations/)
