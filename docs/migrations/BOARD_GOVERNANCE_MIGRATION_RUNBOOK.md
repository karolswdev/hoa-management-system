# Board Governance Migration Runbook

## Overview

This runbook documents the database migrations and seeders for the Board Governance module (Iteration I1, Task I1.T1).

**Objective:** Establish board governance schemas, controllers, and initial architectural artifacts that define module boundaries for downstream work.

---

## Migration Files

### 1. Board Titles Table
**File:** `backend/migrations/20250531214400-create-board-titles-table.js`

**Purpose:** Creates the `board_titles` table to store predefined board positions (President, Vice President, etc.)

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `title` (STRING, unique, not null) - e.g., "President", "Secretary"
- `rank` (INTEGER, not null) - Determines display order (lower = higher priority)
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_board_titles_rank` on `rank` column for efficient sorting

**Rollback:** Drops the `board_titles` table

---

### 2. Board Members Table
**File:** `backend/migrations/20250531214401-create-board-members-table.js`

**Purpose:** Creates the `board_members` table to track current and historical board member assignments

**Schema:**
- `id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER, FK to users.id, not null, CASCADE on delete/update)
- `title_id` (INTEGER, FK to board_titles.id, not null, RESTRICT on delete, CASCADE on update)
- `start_date` (DATEONLY, not null) - Date member assumed position
- `end_date` (DATEONLY, nullable) - NULL indicates current active position
- `bio` (TEXT, nullable) - Optional biography or message
- `created_at` (DATE, not null)
- `updated_at` (DATE, not null)

**Indexes:**
- `idx_board_members_title_start` on (`title_id`, `start_date`) - For sorting current members by title rank
- `idx_board_members_user_end` on (`user_id`, `end_date`) - For user position history queries
- `idx_board_members_end_date` on `end_date` - For efficiently querying current members (WHERE end_date IS NULL)

**Foreign Key Constraints:**
- `user_id` → `users.id` (CASCADE on delete/update) - If user deleted, their board history is removed
- `title_id` → `board_titles.id` (RESTRICT on delete, CASCADE on update) - Prevents deletion of titles still in use

**Rollback:** Drops the `board_members` table

---

## Seeder Files

### 1. Board Config Flags
**File:** `backend/seeders/20250531214407-board-config-flags.js`

**Purpose:** Seeds configuration flags that control board roster visibility

**Config Keys Inserted:**
- `board.visibility` = `public` - Controls whether current roster is visible to guests (values: `public` or `members_only`)
- `board.history-visibility` = `members_only` - Controls access to historical records (always `members_only` per security requirements)

**Idempotency:** Checks for existing keys before inserting; skips if already present

**Rollback:** Deletes the `board.visibility` and `board.history-visibility` config keys

---

### 2. Board Titles
**File:** `backend/seeders/20250531214408-board-titles.js`

**Purpose:** Seeds standard HOA board titles with proper rank ordering

**Titles Inserted:**
1. President (rank: 1)
2. Vice President (rank: 2)
3. Secretary (rank: 3)
4. Treasurer (rank: 4)
5. Board Member at Large (rank: 5)

**Idempotency:** Checks for existing titles before inserting; skips if already present

**Rollback:** Deletes all seeded board titles by name

---

## Execution Order

### Running Migrations

```bash
# From backend directory
cd backend

# Run all pending migrations (executes in timestamp order)
npx sequelize-cli db:migrate

# Expected output:
# == 20250531214400-create-board-titles-table: migrating =======
# == 20250531214400-create-board-titles-table: migrated (0.XXXs)
# == 20250531214401-create-board-members-table: migrating =======
# == 20250531214401-create-board-members-table: migrated (0.XXXs)
```

### Running Seeders

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Or run specific seeders in order:
npx sequelize-cli db:seed --seed 20250531214407-board-config-flags.js
npx sequelize-cli db:seed --seed 20250531214408-board-titles.js

# Expected output:
# == 20250531214407-board-config-flags: seeding =======
# == 20250531214407-board-config-flags: seeded (0.XXXs)
# == 20250531214408-board-titles: seeding =======
# == 20250531214408-board-titles: seeded (0.XXXs)
```

---

## Verification Steps

### 1. Verify Tables Created

```bash
# Open SQLite database
sqlite3 backend/database.sqlite

# Check tables exist
.tables
# Should show: board_titles, board_members (among others)

# Verify board_titles schema
.schema board_titles

# Verify board_members schema
.schema board_members
```

### 2. Verify Indexes

```sql
-- Check indexes on board_titles
SELECT name, sql FROM sqlite_master
WHERE type='index' AND tbl_name='board_titles';

-- Expected: idx_board_titles_rank

-- Check indexes on board_members
SELECT name, sql FROM sqlite_master
WHERE type='index' AND tbl_name='board_members';

-- Expected: idx_board_members_title_start, idx_board_members_user_end, idx_board_members_end_date
```

### 3. Verify Seeded Data

```sql
-- Verify config flags
SELECT * FROM config WHERE key LIKE 'board.%';

-- Expected output:
-- board.visibility | public
-- board.history-visibility | members_only

-- Verify board titles
SELECT id, title, rank FROM board_titles ORDER BY rank;

-- Expected output (5 rows):
-- 1 | President | 1
-- 2 | Vice President | 2
-- 3 | Secretary | 3
-- 4 | Treasurer | 4
-- 5 | Board Member at Large | 5
```

### 4. Verify Foreign Key Constraints

```sql
-- Check foreign keys on board_members
PRAGMA foreign_key_list(board_members);

-- Expected output shows two FKs:
-- 0 | users | user_id → id (CASCADE/CASCADE)
-- 1 | board_titles | title_id → id (RESTRICT/CASCADE)
```

---

## Rollback Procedures

### Rollback Seeders

```bash
# Undo specific seeder
npx sequelize-cli db:seed:undo --seed 20250531214408-board-titles.js
npx sequelize-cli db:seed:undo --seed 20250531214407-board-config-flags.js

# Or undo all seeders
npx sequelize-cli db:seed:undo:all
```

### Rollback Migrations

```bash
# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo specific migration
npx sequelize-cli db:migrate:undo:all --to 20250531214312-create-audit-logs-table.js

# This will rollback both board migrations, returning to the audit_logs migration state
```

### Manual Rollback (if needed)

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS board_members;
DROP TABLE IF EXISTS board_titles;

-- Remove config flags
DELETE FROM config WHERE key IN ('board.visibility', 'board.history-visibility');
```

---

## Testing Checklist

- [ ] Migrations run cleanly on fresh database without errors
- [ ] All tables created with correct column names and types
- [ ] All indexes created successfully
- [ ] Foreign key constraints properly configured
- [ ] Seeders insert data without errors
- [ ] Config flags inserted with correct default values
- [ ] All 5 board titles inserted with correct ranks
- [ ] Re-running seeders is idempotent (no duplicates)
- [ ] Rollback scripts successfully restore pre-migration state
- [ ] No orphaned data after rollback

---

## Common Issues & Troubleshooting

### Issue: "SQLITE_ERROR: foreign key mismatch"
**Cause:** board_members migration ran before board_titles migration
**Solution:** Ensure migrations run in timestamp order; drop tables and re-run

### Issue: "UNIQUE constraint failed: board_titles.title"
**Cause:** Seeder ran multiple times without idempotency check
**Solution:** Seeders include existence checks; if error persists, check for data corruption

### Issue: "Cannot delete from board_titles: FOREIGN KEY constraint failed"
**Cause:** Attempting to delete a title that has board_members referencing it
**Solution:** This is expected behavior (RESTRICT constraint); delete or update board_members first

---

## Dependencies

**Prerequisite Migrations:**
- `20250531213155-create-users-table.js` (board_members references users)
- `20250531214039-create-users-table.js`
- `20250531214112-create-config-table.js` (config flags seeder requires config table)

**No Dependencies:** This migration set has no downstream dependencies yet

---

## Architecture Notes

**Design Decisions:**
1. **Separate Tables:** board_titles and board_members are separate to allow title reuse and historical tracking
2. **Rank Ordering:** Numeric rank field allows flexible reordering without string sorting issues
3. **Nullable end_date:** NULL indicates current position; simplifies "active board" queries
4. **RESTRICT on title deletion:** Prevents accidental deletion of titles still in use
5. **Config-based visibility:** Feature flags allow runtime control without code changes

**Performance Considerations:**
- Indexes on frequently-queried columns (rank, end_date, composite indexes)
- Small dataset (~5 titles, ~5-10 active members) - no pagination needed
- Compound indexes optimize common queries (current members by rank)

---

## Related Documentation

- **Requirements:** `specifications.md` Section 2.1 (Board Member Management & History)
- **Architecture:** `.codemachine/artifacts/architecture/02_System_Structure_and_Data.md`
- **Task Definition:** `.codemachine/artifacts/tasks/tasks_I1.json` (Task I1.T1)

---

**Last Updated:** 2025-11-23
**Task:** I1.T1
**Iteration:** I1
**Status:** Completed
