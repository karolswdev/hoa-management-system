# Polls & Democracy Stack Migration Runbook

## Overview

This runbook documents the database migrations and seeders for the Polls & Democracy module (Iteration I3, Task I3.T1).

**Objective:** Establish democracy stack schemas (polls, voting, receipts, hash chains, notifications) enabling informal + binding voting with cryptographic integrity and optional email notifications.

---

## Migration Files

### 1. Polls Table
**File:** `backend/migrations/20250115000000-create-polls-table.js`

**Purpose:** Creates the `polls` table to store poll definitions, metadata, and configuration

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `title` (STRING, not null) - Poll title/question
- `description` (TEXT, nullable) - Optional detailed description
- `type` (STRING, not null) - Poll type: informal, binding, or straw-poll
- `is_anonymous` (BOOLEAN, not null, default: false) - Anonymous voting flag
- `notify_members` (BOOLEAN, not null, default: false) - Email notification flag
- `start_at` (DATE, not null) - Poll open timestamp
- `end_at` (DATE, not null) - Poll close timestamp
- `created_by` (INTEGER, FK to users.id, not null, RESTRICT on delete)
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_polls_time_range` on (`start_at`, `end_at`) - For filtering active/upcoming polls
- `idx_polls_created_by` on `created_by` - For finding polls by creator
- `idx_polls_type` on `type` - For filtering by poll type

**Foreign Key Constraints:**
- `created_by` → `users.id` (RESTRICT on delete, CASCADE on update) - Prevents deletion of users who created polls

**Rollback:** Drops the `polls` table

---

### 2. Poll Options Table
**File:** `backend/migrations/20250115000001-create-poll-options-table.js`

**Purpose:** Creates the `poll_options` table to store voting choices for each poll

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `poll_id` (INTEGER, FK to polls.id, not null, CASCADE on delete/update)
- `text` (STRING, not null) - Option text displayed to voters
- `order_index` (INTEGER, not null) - Display order (lower numbers first)
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_poll_options_poll_order` on (`poll_id`, `order_index`) - For retrieving options in display order
- `idx_poll_options_unique_order` on (`poll_id`, `order_index`) - UNIQUE constraint preventing duplicate order within poll

**Foreign Key Constraints:**
- `poll_id` → `polls.id` (CASCADE on delete/update) - Deleting a poll removes its options

**Rollback:** Drops the `poll_options` table

---

### 3. Votes Table
**File:** `backend/migrations/20250115000002-create-votes-table.js`

**Purpose:** Creates the `votes` table with hash chain columns for tamper-proof vote recording

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `poll_id` (INTEGER, FK to polls.id, not null, CASCADE on delete/update)
- `user_id` (INTEGER, FK to users.id, nullable, SET NULL on delete) - NULL for anonymous votes
- `option_id` (INTEGER, FK to poll_options.id, not null, CASCADE on delete/update)
- `timestamp` (DATE, not null, default: CURRENT_TIMESTAMP) - Vote cast time
- `prev_hash` (STRING, nullable) - Hash of previous vote in chain (NULL for first vote)
- `vote_hash` (STRING, not null, unique) - Cryptographic hash of this vote
- `receipt_code` (STRING, not null, unique) - Unique receipt code for voter verification
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_votes_poll_timestamp` on (`poll_id`, `timestamp`) - **REQUIRED** for hash chain verification
- `idx_votes_vote_hash` on `vote_hash` - **REQUIRED** for integrity checks
- `idx_votes_receipt_code` on `receipt_code` - For voter receipt lookups
- `idx_votes_user_poll` on (`user_id`, `poll_id`) - For user voting history
- `idx_votes_option` on `option_id` - For counting votes per option

**Foreign Key Constraints:**
- `poll_id` → `polls.id` (CASCADE on delete/update)
- `user_id` → `users.id` (SET NULL on delete, CASCADE on update) - Preserves votes if user deleted
- `option_id` → `poll_options.id` (CASCADE on delete/update)

**Hash Chain Mechanism:**
- Each vote's `vote_hash` includes: poll_id + option_id + timestamp + prev_hash
- First vote in chain has `prev_hash = NULL`
- Subsequent votes link to previous vote via `prev_hash`
- Enables tamper detection and vote integrity verification

**Rollback:** Drops the `votes` table

---

### 4. Email Audit Table
**File:** `backend/migrations/20250115000003-create-email-audit-table.js`

**Purpose:** Creates the `email_audit` table to log batch email sends for compliance and debugging

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `template` (STRING, not null) - Template identifier (e.g., "poll_notification")
- `recipient_count` (INTEGER, not null) - Number of recipients
- `request_payload_hash` (STRING, not null) - SHA-256 hash of request payload
- `sent_at` (DATE, not null, default: CURRENT_TIMESTAMP)
- `status` (STRING, not null) - Status: success, failed, partial
- `metadata_json` (TEXT, nullable) - Optional JSON metadata (errors, SendGrid response, etc.)
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_email_audit_template` on `template` - For filtering by template type
- `idx_email_audit_sent_at` on `sent_at` - For time-based queries
- `idx_email_audit_status` on `status` - For finding failures
- `idx_email_audit_template_sent` on (`template`, `sent_at`) - For template-specific reporting

**Rollback:** Drops the `email_audit` table

---

### 5. Resident Notification Log Table
**File:** `backend/migrations/20250115000004-create-resident-notification-log-table.js`

**Purpose:** Creates the `resident_notification_log` table to track individual user notifications

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER, FK to users.id, not null, CASCADE on delete/update)
- `email_audit_id` (INTEGER, FK to email_audit.id, nullable, SET NULL on delete)
- `notification_type` (STRING, not null) - Type: poll_created, poll_reminder, vote_receipt, etc.
- `channel` (STRING, not null) - Channel: email, in_app, sms (future)
- `entity_type` (STRING, nullable) - Related entity type: poll, vote, etc.
- `entity_id` (INTEGER, nullable) - ID of related entity
- `sent_at` (DATE, not null, default: CURRENT_TIMESTAMP)
- `status` (STRING, not null) - Status: sent, failed, bounced, opened
- `metadata_json` (TEXT, nullable) - Optional JSON metadata
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_notification_log_user_sent` on (`user_id`, `sent_at`) - For user notification history
- `idx_notification_log_type` on `notification_type` - For filtering by type
- `idx_notification_log_entity` on (`entity_type`, `entity_id`) - For entity-specific queries
- `idx_notification_log_email_audit` on `email_audit_id` - For batch lookups
- `idx_notification_log_status` on `status` - For status reporting
- `idx_notification_log_channel` on `channel` - For channel-based queries

**Foreign Key Constraints:**
- `user_id` → `users.id` (CASCADE on delete/update)
- `email_audit_id` → `email_audit.id` (SET NULL on delete, CASCADE on update)

**Rollback:** Drops the `resident_notification_log` table

---

## Seeder Files

### 1. Poll Config Flags
**File:** `backend/seeders/20250115000000-poll-config-flags.js`

**Purpose:** Seeds configuration flags that control poll/voting features

**Config Keys Inserted:**
- `polls.binding-enabled` = `true` - Enable binding (official) polls requiring authentication
- `polls.anonymous-enabled` = `true` - Enable anonymous voting for informal polls
- `polls.notify-members-enabled` = `true` - Enable email notifications for new polls
- `polls.default-duration-days` = `7` - Default poll duration in days
- `polls.receipt-generation-enabled` = `true` - Generate cryptographic receipts
- `polls.hash-chain-enabled` = `true` - Enable vote hash chain integrity

**Idempotency:** Checks for existing keys before inserting; skips if already present

**Rollback:** Deletes all poll-related config keys

---

### 2. Sample Poll
**File:** `backend/seeders/20250115000001-sample-poll.js`

**Purpose:** Seeds a sample poll with multiple options for testing and demonstration

**Poll Created:**
- **Title:** "HOA Community Survey - Pool Hours"
- **Description:** Help decide community pool operating hours for summer
- **Type:** informal
- **Duration:** 7 days from seed time
- **Options:**
  1. "9 AM - 6 PM (Standard Hours)" (order_index: 1)
  2. "8 AM - 8 PM (Extended Hours)" (order_index: 2)
  3. "10 AM - 7 PM (Weekend Only Extended)" (order_index: 3)
  4. "Keep Current Schedule" (order_index: 4)

**Prerequisites:** Requires at least one admin user to exist in the `users` table

**Idempotency:** Checks for existing poll by title; skips if already present

**Rollback:** Deletes poll options first, then the poll itself

---

## Execution Order

### Running Migrations

```bash
# From backend directory
cd backend

# Run all pending migrations (executes in timestamp order)
npx sequelize-cli db:migrate

# Expected output:
# == 20250115000000-create-polls-table: migrating =======
# == 20250115000000-create-polls-table: migrated (0.XXXs)
# == 20250115000001-create-poll-options-table: migrating =======
# == 20250115000001-create-poll-options-table: migrated (0.XXXs)
# == 20250115000002-create-votes-table: migrating =======
# == 20250115000002-create-votes-table: migrated (0.XXXs)
# == 20250115000003-create-email-audit-table: migrating =======
# == 20250115000003-create-email-audit-table: migrated (0.XXXs)
# == 20250115000004-create-resident-notification-log-table: migrating =======
# == 20250115000004-create-resident-notification-log-table: migrated (0.XXXs)
```

### Running Seeders

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Or run specific seeders in order:
npx sequelize-cli db:seed --seed 20250115000000-poll-config-flags.js
npx sequelize-cli db:seed --seed 20250115000001-sample-poll.js

# Expected output:
# == 20250115000000-poll-config-flags: seeding =======
# == 20250115000000-poll-config-flags: seeded (0.XXXs)
# == 20250115000001-sample-poll: seeding =======
# Sample poll created with ID 1 and 4 options.
# == 20250115000001-sample-poll: seeded (0.XXXs)
```

---

## Verification Steps

### 1. Verify Tables Created

```bash
# Open SQLite database
sqlite3 backend/database.sqlite

# Check tables exist
.tables
# Should show: polls, poll_options, votes, email_audit, resident_notification_log (among others)

# Verify polls schema
.schema polls

# Verify votes schema (check for hash chain columns)
.schema votes
```

### 2. Verify Indexes

```sql
-- Check indexes on polls
SELECT name, sql FROM sqlite_master
WHERE type='index' AND tbl_name='polls';

-- Expected: idx_polls_time_range, idx_polls_created_by, idx_polls_type

-- Check indexes on votes (CRITICAL for hash chain)
SELECT name, sql FROM sqlite_master
WHERE type='index' AND tbl_name='votes';

-- Expected: idx_votes_poll_timestamp, idx_votes_vote_hash, idx_votes_receipt_code, etc.

-- Check indexes on poll_options
SELECT name, sql FROM sqlite_master
WHERE type='index' AND tbl_name='poll_options';

-- Expected: idx_poll_options_poll_order, idx_poll_options_unique_order
```

### 3. Verify Seeded Data

```sql
-- Verify poll config flags
SELECT * FROM config WHERE key LIKE 'polls.%';

-- Expected output (6 rows):
-- polls.binding-enabled | true
-- polls.anonymous-enabled | true
-- polls.notify-members-enabled | true
-- polls.default-duration-days | 7
-- polls.receipt-generation-enabled | true
-- polls.hash-chain-enabled | true

-- Verify sample poll
SELECT id, title, type, is_anonymous, notify_members FROM polls;

-- Expected output:
-- 1 | HOA Community Survey - Pool Hours | informal | 0 | 0

-- Verify poll options
SELECT id, poll_id, text, order_index FROM poll_options ORDER BY order_index;

-- Expected output (4 rows):
-- 1 | 1 | 9 AM - 6 PM (Standard Hours) | 1
-- 2 | 1 | 8 AM - 8 PM (Extended Hours) | 2
-- 3 | 1 | 10 AM - 7 PM (Weekend Only Extended) | 3
-- 4 | 1 | Keep Current Schedule | 4

-- Verify votes table is empty (no votes cast yet)
SELECT COUNT(*) FROM votes;
-- Expected: 0
```

### 4. Verify Foreign Key Constraints

```sql
-- Check foreign keys on votes
PRAGMA foreign_key_list(votes);

-- Expected output shows three FKs:
-- 0 | polls | poll_id → id (CASCADE/CASCADE)
-- 1 | users | user_id → id (SET NULL/CASCADE)
-- 2 | poll_options | option_id → id (CASCADE/CASCADE)

-- Check foreign keys on poll_options
PRAGMA foreign_key_list(poll_options);

-- Expected:
-- 0 | polls | poll_id → id (CASCADE/CASCADE)

-- Check foreign keys on resident_notification_log
PRAGMA foreign_key_list(resident_notification_log);

-- Expected:
-- 0 | users | user_id → id (CASCADE/CASCADE)
-- 1 | email_audit | email_audit_id → id (SET NULL/CASCADE)
```

### 5. Test Hash Chain Integrity Setup

```sql
-- Verify vote_hash and prev_hash columns exist and have correct types
SELECT sql FROM sqlite_master WHERE type='table' AND name='votes';

-- Check for UNIQUE constraint on vote_hash
SELECT name FROM sqlite_master
WHERE type='index' AND tbl_name='votes' AND sql LIKE '%vote_hash%UNIQUE%';

-- Check for UNIQUE constraint on receipt_code
SELECT name FROM sqlite_master
WHERE type='index' AND tbl_name='votes' AND sql LIKE '%receipt_code%UNIQUE%';
```

---

## Rollback Procedures

### Rollback Seeders

```bash
# Undo specific seeder (reverse order)
npx sequelize-cli db:seed:undo --seed 20250115000001-sample-poll.js
npx sequelize-cli db:seed:undo --seed 20250115000000-poll-config-flags.js

# Or undo all seeders
npx sequelize-cli db:seed:undo:all
```

### Rollback Migrations

```bash
# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all poll-related migrations (5 tables)
npx sequelize-cli db:migrate:undo:all --to 20250531214402-create-contact-requests-table.js

# This will rollback to the state after contact_requests, removing all poll tables
```

### Manual Rollback (if needed)

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS resident_notification_log;
DROP TABLE IF EXISTS email_audit;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS poll_options;
DROP TABLE IF EXISTS polls;

-- Remove config flags
DELETE FROM config WHERE key IN (
  'polls.binding-enabled',
  'polls.anonymous-enabled',
  'polls.notify-members-enabled',
  'polls.default-duration-days',
  'polls.receipt-generation-enabled',
  'polls.hash-chain-enabled'
);
```

---

## Testing Checklist

- [ ] All 5 migrations run cleanly on fresh database without errors
- [ ] All tables created with correct column names and types
- [ ] All indexes created successfully (verify with `.schema` and `sqlite_master` queries)
- [ ] Foreign key constraints properly configured
- [ ] Hash chain columns (`prev_hash`, `vote_hash`) exist with correct types
- [ ] UNIQUE constraints on `vote_hash` and `receipt_code` enforced
- [ ] Required indexes present: `idx_votes_poll_timestamp`, `idx_votes_vote_hash`
- [ ] Seeders insert data without errors
- [ ] All 6 poll config flags inserted with correct default values
- [ ] Sample poll created with 4 options in correct order
- [ ] Re-running seeders is idempotent (no duplicates)
- [ ] Rollback scripts successfully restore pre-migration state
- [ ] No orphaned data after rollback

---

## Common Issues & Troubleshooting

### Issue: "SQLITE_ERROR: foreign key mismatch"
**Cause:** Migrations ran out of order (e.g., votes before polls)
**Solution:** Ensure migrations run in timestamp order; drop tables and re-run with `db:migrate`

### Issue: "UNIQUE constraint failed: votes.vote_hash"
**Cause:** Duplicate vote hash generated (hash function issue or duplicate vote)
**Solution:** Verify hash generation logic includes all required fields (poll_id, option_id, timestamp, prev_hash)

### Issue: "Cannot insert NULL into votes.vote_hash"
**Cause:** Vote service not generating hash before insert
**Solution:** Ensure vote service calculates `vote_hash` and `receipt_code` before database insert

### Issue: "No admin user found" during sample poll seed
**Cause:** Seeder requires an admin user to set as poll creator
**Solution:** Create an admin user first, or modify seeder to use any existing user

### Issue: "UNIQUE constraint failed: poll_options.poll_id, order_index"
**Cause:** Attempting to insert duplicate order_index for same poll
**Solution:** This is expected behavior; ensure order_index values are unique within each poll

### Issue: Hash chain verification fails
**Cause:** Votes inserted out of timestamp order, or prev_hash not properly linked
**Solution:**
1. Verify `idx_votes_poll_timestamp` index exists
2. Ensure vote service retrieves latest vote by `ORDER BY timestamp DESC LIMIT 1`
3. Check that prev_hash copies vote_hash from previous vote correctly

---

## Dependencies

**Prerequisite Migrations:**
- `20250531213155-create-users-table.js` (polls.created_by and votes.user_id reference users)
- `20250531214112-create-config-table.js` (config flags seeder requires config table)

**Downstream Dependencies:**
- I3.T2 (Vote service implementation - will use these schemas)
- I3.T3 (Poll UI components - will query these tables)
- I3.T4 (Hash chain diagram generator - will read votes table)

---

## Architecture Notes

**Design Decisions:**

1. **Separate Tables:** polls, poll_options, votes separated for normalization and flexibility
2. **Nullable user_id:** Supports both anonymous and binding votes in same schema
3. **Hash Chain Columns:** `prev_hash` and `vote_hash` enable tamper-proof vote recording
4. **Receipt Codes:** Unique codes allow voters to verify their vote was recorded without exposing vote content
5. **Email Audit vs Notification Log:** Batch-level audit (email_audit) separate from per-user tracking (resident_notification_log)
6. **Config-based Features:** Feature flags allow runtime control without code changes
7. **Timestamp Indexing:** Critical for hash chain verification and chronological vote ordering
8. **SET NULL on user deletion:** Preserves vote history even if user account deleted (for anonymous polls)

**Performance Considerations:**
- Composite index (`poll_id`, `timestamp`) optimizes hash chain traversal
- Unique index on `vote_hash` prevents duplicate votes and enables fast integrity checks
- Index on `receipt_code` supports fast voter verification lookups
- Small dataset expected (~100-1000 votes per poll) - no pagination needed for hash chain
- Notification log may grow large over time - consider archival strategy for logs >1 year old

**Security Considerations:**
- Hash chain provides tamper evidence, not tamper prevention
- Receipt codes should be cryptographically random (use `crypto.randomBytes()`)
- Vote hashes should use SHA-256 or stronger
- Anonymous votes must NOT log user_id (enforce in service layer)
- Email audit logs must NOT contain PII beyond recipient count

---

## Hash Chain Implementation Guide

### Hash Chain Flow:
1. **First Vote in Poll:**
   - `prev_hash = NULL`
   - `vote_hash = SHA256(poll_id + option_id + timestamp + "genesis")`

2. **Subsequent Votes:**
   - Retrieve latest vote: `SELECT vote_hash FROM votes WHERE poll_id = ? ORDER BY timestamp DESC LIMIT 1`
   - `prev_hash = [latest vote's vote_hash]`
   - `vote_hash = SHA256(poll_id + option_id + timestamp + prev_hash)`

3. **Verification:**
   - Retrieve all votes: `SELECT * FROM votes WHERE poll_id = ? ORDER BY timestamp ASC`
   - For each vote, recalculate hash and compare with stored `vote_hash`
   - Verify each `prev_hash` matches previous vote's `vote_hash`
   - Any mismatch indicates tampering

### Receipt Code Generation:
```javascript
const crypto = require('crypto');
const receiptCode = crypto.randomBytes(16).toString('hex').toUpperCase();
// Example: "A3F2E1D4C5B6A7F8E9D0C1B2A3F4E5D6"
```

---

## Related Documentation

- **Requirements:** `specifications.md` Section 2.2 (Polls and Voting)
- **Architecture:** `.codemachine/artifacts/architecture/02_System_Structure_and_Data.md` Section 3.6
- **Task Definition:** `.codemachine/artifacts/plan/02_Iteration_I3.md` (Task I3.T1)
- **Data Model:** `.codemachine/artifacts/architecture/01_Blueprint_Foundation.md` Section 5.0

---

**Last Updated:** 2025-01-15
**Task:** I3.T1
**Iteration:** I3
**Status:** Completed
