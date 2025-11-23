# Democracy API Reference

## Overview

The Democracy API provides endpoints for creating polls, casting votes, and verifying vote integrity using cryptographic hash chains.

## Base URL

```
/api/polls
```

## Authentication

- 🌐 **Public**: No authentication required
- 🔑 **Member**: Requires valid JWT token with `member` or `admin` role
- 🔒 **Admin**: Requires valid JWT token with `admin` role

---

## Endpoints

### List Polls

Get active, scheduled, and closed polls.

**Endpoint:** `GET /api/polls`
**Auth:** 🌐 Public (optional auth for personalized views)

**Query Parameters:**

| Parameter | Type   | Description                                         |
|-----------|--------|-----------------------------------------------------|
| `type`    | string | Filter by poll type: `informal`, `binding`, `straw-poll` |
| `status`  | string | Filter by status: `active`, `scheduled`, `closed`  |

**Example Request:**
```bash
curl -X GET "https://api.hoa.example.com/api/polls?status=active"
```

**Example Response:**
```json
{
  "polls": [
    {
      "id": 1,
      "title": "Budget Approval 2025",
      "description": "Vote on the proposed 2025 community budget",
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

---

### Get Poll Details

Retrieve detailed information about a specific poll.

**Endpoint:** `GET /api/polls/:id`
**Auth:** 🌐 Public

**Path Parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `id`      | integer | Poll ID     |

**Query Parameters:**

| Parameter         | Type    | Description                              |
|-------------------|---------|------------------------------------------|
| `include_results` | boolean | Include vote counts (closed polls only)  |

**Example Request:**
```bash
curl -X GET "https://api.hoa.example.com/api/polls/1?include_results=true"
```

**Example Response:**
```json
{
  "poll": {
    "id": 1,
    "title": "Budget Approval 2025",
    "description": "Vote on the proposed 2025 community budget",
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
}
```

---

### Create Poll

Create a new poll (admin only).

**Endpoint:** `POST /api/polls`
**Auth:** 🔒 Admin

**Request Body:**

| Field            | Type     | Required | Description                                    |
|------------------|----------|----------|------------------------------------------------|
| `title`          | string   | Yes      | Poll title (max 255 chars)                     |
| `description`    | string   | No       | Detailed poll description                      |
| `type`           | string   | Yes      | Poll type: `informal`, `binding`, `straw-poll` |
| `is_anonymous`   | boolean  | No       | Allow anonymous voting (default: false)        |
| `notify_members` | boolean  | No       | Send email notifications (default: false)      |
| `start_at`       | datetime | Yes      | Poll opening time (ISO 8601)                   |
| `end_at`         | datetime | Yes      | Poll closing time (ISO 8601)                   |
| `options`        | array    | Yes      | Poll options (minimum 2)                       |

**Option Object:**

| Field         | Type    | Required | Description                           |
|---------------|---------|----------|---------------------------------------|
| `text`        | string  | Yes      | Option text (max 255 chars)           |
| `order_index` | integer | No       | Display order (auto-assigned if omitted) |

**Example Request:**
```bash
curl -X POST "https://api.hoa.example.com/api/polls" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Example Response:**
```json
{
  "message": "Poll created successfully",
  "poll": {
    "id": 1,
    "title": "Budget Approval 2025",
    "description": "Vote on the proposed 2025 community budget",
    "type": "binding",
    "is_anonymous": false,
    "notify_members": true,
    "start_at": "2025-01-20T00:00:00Z",
    "end_at": "2025-01-27T23:59:59Z",
    "created_by": 1,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z",
    "options": [
      {"id": 1, "poll_id": 1, "text": "Approve", "order_index": 0},
      {"id": 2, "poll_id": 1, "text": "Reject", "order_index": 1},
      {"id": 3, "poll_id": 1, "text": "Abstain", "order_index": 2}
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields, invalid date range, insufficient options
- `403 Forbidden`: Binding polls disabled (feature flag), non-admin user
- `500 Internal Server Error`: Database or validation error

---

### Cast Vote

Cast a vote in an active poll.

**Endpoint:** `POST /api/polls/:id/votes`
**Auth:** 🔑 Member

**Path Parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `id`      | integer | Poll ID     |

**Request Body:**

| Field       | Type    | Required | Description              |
|-------------|---------|----------|--------------------------|
| `option_id` | integer | Yes      | ID of selected poll option |

**Example Request:**
```bash
curl -X POST "https://api.hoa.example.com/api/polls/1/votes" \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"option_id": 1}'
```

**Example Response:**
```json
{
  "message": "Vote cast successfully",
  "receipt": "A1B2C3D4E5F6G7H8",
  "submitted_at": "2025-01-23T12:00:00Z",
  "integrity": {
    "vote_hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "prev_hash": "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Poll not started, poll closed, invalid option, missing option_id
- `401 Unauthorized`: No authentication token provided
- `403 Forbidden`: User not a member
- `404 Not Found`: Poll not found
- `409 Conflict`: User already voted in this poll

**Notes:**
- Receipt codes are unique identifiers for vote verification
- Hash chain ensures vote integrity and immutability
- For anonymous polls, user_id is not stored

---

### Verify Receipt

Verify a vote receipt and retrieve vote metadata.

**Endpoint:** `GET /api/polls/receipts/:code`
**Auth:** 🌐 Public

**Path Parameters:**

| Parameter | Type   | Description                 |
|-----------|--------|-----------------------------|
| `code`    | string | Receipt code (16 chars)     |

**Example Request:**
```bash
curl -X GET "https://api.hoa.example.com/api/polls/receipts/A1B2C3D4E5F6G7H8"
```

**Example Response (Valid Receipt):**
```json
{
  "message": "Receipt verified",
  "receipt": {
    "poll": {
      "id": 1,
      "title": "Budget Approval 2025",
      "type": "binding"
    },
    "option": {
      "id": 1,
      "text": "Approve"
    },
    "timestamp": "2025-01-23T12:00:00Z",
    "vote_hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "prev_hash": "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9",
    "receipt_code": "A1B2C3D4E5F6G7H8"
  }
}
```

**Example Response (Invalid Receipt):**
```json
{
  "message": "Receipt not found"
}
```

**Notes:**
- User identity is never exposed in receipt verification
- Returns 404 for both invalid and non-existent receipts (constant-time response)
- Receipt codes are case-insensitive

---

### Get Poll Results

Retrieve vote counts for a poll.

**Endpoint:** `GET /api/polls/:id/results`
**Auth:** 🌐 Public (closed polls) / 🔒 Admin (active polls)

**Path Parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `id`      | integer | Poll ID     |

**Example Request:**
```bash
curl -X GET "https://api.hoa.example.com/api/polls/1/results"
```

**Example Response:**
```json
{
  "poll": {
    "id": 1,
    "title": "Budget Approval 2025",
    "type": "binding",
    "status": "closed"
  },
  "results": [
    {"option_id": 1, "text": "Approve", "vote_count": 42},
    {"option_id": 2, "text": "Reject", "vote_count": 15},
    {"option_id": 3, "text": "Abstain", "vote_count": 8}
  ]
}
```

**Error Responses:**

- `403 Forbidden`: Poll is active and user is not admin
- `404 Not Found`: Poll not found

---

### Validate Poll Integrity

Validate the cryptographic hash chain for a poll.

**Endpoint:** `GET /api/polls/:id/integrity`
**Auth:** 🔒 Admin

**Path Parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `id`      | integer | Poll ID     |

**Example Request:**
```bash
curl -X GET "https://api.hoa.example.com/api/polls/1/integrity" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Example Response (Valid Chain):**
```json
{
  "message": "Hash chain validation completed",
  "validation": {
    "valid": true,
    "totalVotes": 65,
    "brokenLinks": [],
    "message": "Hash chain is valid"
  }
}
```

**Example Response (Broken Chain):**
```json
{
  "message": "Hash chain validation completed",
  "validation": {
    "valid": false,
    "totalVotes": 65,
    "brokenLinks": [
      {
        "index": 12,
        "voteId": 345,
        "reason": "Hash mismatch - vote data may have been tampered with"
      },
      {
        "index": 13,
        "voteId": 346,
        "reason": "Chain break - prev_hash does not match previous vote_hash"
      }
    ],
    "message": "Found 2 integrity issues"
  }
}
```

**Error Responses:**

- `403 Forbidden`: User is not admin
- `404 Not Found`: Poll not found

**Notes:**
- Validates both individual vote hashes and chain linkage
- Detects tampering, missing votes, and reordering
- Should be run periodically for binding polls

---

## Vote Hash Chain

### Hash Formula

Each vote generates a SHA256 hash:

```
vote_hash = SHA256(user_id + option_id + timestamp + prev_hash)
```

**Components:**
- `user_id`: User ID string (empty for anonymous votes)
- `option_id`: Poll option ID string
- `timestamp`: ISO 8601 timestamp
- `prev_hash`: Previous vote's hash, or `"GENESIS"` for first vote

### Receipt Generation

Receipt codes are derived from vote hashes:

```
receipt_code = vote_hash.substring(0, 16).toUpperCase()
```

Example: `A1B2C3D4E5F6G7H8`

### Chain Validation

The system validates:
1. Each vote's hash matches recomputation
2. Each vote's `prev_hash` equals the previous vote's `vote_hash`
3. First vote has `null` or `"GENESIS"` prev_hash
4. No gaps in the chain sequence

---

## Feature Flags

### `polls.binding-enabled`

Controls whether binding polls can be created.

**Values:**
- `"true"`: Binding polls allowed
- `"false"`: Only informal and straw-poll allowed

**Default:** `true`

### `polls.notify-members-enabled`

Controls whether email notifications are sent when polls are created with `notify_members: true`.

**Values:**
- `"true"`: Emails sent
- `"false"`: Emails logged but not sent

**Default:** `false` (to prevent accidental spam)

---

## Rate Limiting

All poll endpoints are subject to the global API rate limit:

- **Default:** 100 requests per 15 minutes per IP
- **Burst:** Up to 120 requests allowed

Voting endpoints may have additional rate limits to prevent abuse.

---

## Error Codes

| Status | Description                          |
|--------|--------------------------------------|
| 200    | Success                              |
| 201    | Resource created (vote, poll)        |
| 400    | Bad request (validation error)       |
| 401    | Unauthorized (missing/invalid token) |
| 403    | Forbidden (insufficient permissions) |
| 404    | Not found (poll, receipt)            |
| 409    | Conflict (duplicate vote)            |
| 500    | Internal server error                |

---

## Examples

### Complete Voting Workflow

```bash
# 1. Admin creates a poll
curl -X POST "https://api.hoa.example.com/api/polls" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pool Renovation",
    "type": "binding",
    "is_anonymous": false,
    "start_at": "2025-02-01T00:00:00Z",
    "end_at": "2025-02-08T23:59:59Z",
    "options": [
      {"text": "Approve $50k renovation"},
      {"text": "Reject proposal"}
    ]
  }'

# 2. Member views active polls
curl -X GET "https://api.hoa.example.com/api/polls?status=active"

# 3. Member casts vote
curl -X POST "https://api.hoa.example.com/api/polls/2/votes" \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"option_id": 3}'

# Response includes receipt: "B7C8D9E0F1G2H3I4"

# 4. Member verifies receipt
curl -X GET "https://api.hoa.example.com/api/polls/receipts/B7C8D9E0F1G2H3I4"

# 5. After poll closes, anyone can view results
curl -X GET "https://api.hoa.example.com/api/polls/2/results"

# 6. Admin validates integrity
curl -X GET "https://api.hoa.example.com/api/polls/2/integrity" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Related Documentation

- [Democracy Module Overview](./DEMOCRACY_MODULE.md)
- [Architecture Blueprint](../../.codemachine/artifacts/architecture/01_Blueprint_Foundation.md)
- [Database Schema](../migrations/)
- [Testing Guide](./TESTING.md)
