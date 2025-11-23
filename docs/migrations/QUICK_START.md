# Board Governance Migrations - Quick Start Guide

Quick reference for developers working with the Board Governance database schema.

---

## Prerequisites

```bash
cd backend
npm install
```

---

## Development Workflow

### 1. Run Migrations (Development)

```bash
# From backend directory
npm run db:migrate

# Or explicitly
npx sequelize-cli db:migrate
```

This will:
- Create `board_titles` table
- Create `board_members` table
- Run all other pending migrations

### 2. Seed Initial Data

```bash
# Seed config flags
npx sequelize-cli db:seed --seed 20250531214407-board-config-flags.js

# Seed board titles
npx sequelize-cli db:seed --seed 20250531214408-board-titles.js

# Or run all seeds (note: may fail on existing test seeders)
npm run db:seed
```

This will:
- Insert `board.visibility` and `board.history-visibility` config flags
- Insert 5 standard board titles (President, VP, Secretary, Treasurer, Member at Large)

---

## Verification

### Quick Verification Script

```bash
node scripts/verify-board-schema.js
```

Expected output:
```
✅ All validations passed!
   - Schema matches ERD requirements
   - All indexes created
   - Config flags seeded correctly
   - Board titles seeded with proper ranking
   - Foreign key constraints configured
```

### Manual Verification

Install sqlite3 CLI tool if needed:
```bash
sudo apt-get install sqlite3  # Ubuntu/Debian
brew install sqlite3          # macOS
```

Then inspect the database:
```bash
# From backend directory
sqlite3 database/hoa.db

# Check tables
.tables

# Verify board_titles
SELECT * FROM board_titles ORDER BY rank;

# Verify config flags
SELECT * FROM config WHERE key LIKE 'board.%';

# Exit
.exit
```

---

## Common Operations

### Check Migration Status

```bash
npx sequelize-cli db:migrate:status
```

Shows which migrations have been applied.

### Rollback Last Migration

```bash
npx sequelize-cli db:migrate:undo
```

⚠️ **Warning:** This will drop the most recently applied table.

### Rollback Specific Seeders

```bash
# Undo board titles seed
npx sequelize-cli db:seed:undo --seed 20250531214408-board-titles.js

# Undo config flags seed
npx sequelize-cli db:seed:undo --seed 20250531214407-board-config-flags.js
```

### Rollback All Seeds

```bash
npm run db:seed:undo:all
```

⚠️ **Warning:** This removes ALL seeded data, including admin users and site config.

---

## Testing Environment

### Run Migrations on Test Database

```bash
NODE_ENV=test npm run db:migrate
```

Uses `database/test.db` instead of `database/hoa.db`.

### Seed Test Database

```bash
NODE_ENV=test npx sequelize-cli db:seed --seed 20250531214407-board-config-flags.js
NODE_ENV=test npx sequelize-cli db:seed --seed 20250531214408-board-titles.js
```

### Reset Test Database

```bash
# Delete test database
rm -f database/test.db

# Re-run migrations
NODE_ENV=test npm run db:migrate

# Re-seed
NODE_ENV=test npx sequelize-cli db:seed --seed 20250531214407-board-config-flags.js
NODE_ENV=test npx sequelize-cli db:seed --seed 20250531214408-board-titles.js
```

---

## File Locations

```
backend/
├── migrations/
│   ├── 20250531214400-create-board-titles-table.js
│   └── 20250531214401-create-board-members-table.js
├── seeders/
│   ├── 20250531214407-board-config-flags.js
│   └── 20250531214408-board-titles.js
├── scripts/
│   └── verify-board-schema.js
└── database/
    ├── hoa.db        # Development database
    └── test.db       # Test database

docs/migrations/
├── BOARD_GOVERNANCE_MIGRATION_RUNBOOK.md  # Comprehensive guide
├── I1_T1_COMPLETION_SUMMARY.md            # Task completion report
├── board-schema-erd.md                    # Visual schema reference
└── QUICK_START.md                         # This file
```

---

## Troubleshooting

### Error: "SQLITE_ERROR: table board_titles already exists"

**Cause:** Migration already applied.

**Solution:** Check migration status:
```bash
npx sequelize-cli db:migrate:status
```

### Error: "UNIQUE constraint failed: board_titles.title"

**Cause:** Seeder ran multiple times.

**Solution:** Seeders are idempotent; check logs for "already exists" messages. If corrupted:
```bash
# Rollback seeder
npx sequelize-cli db:seed:undo --seed 20250531214408-board-titles.js

# Re-run seeder
npx sequelize-cli db:seed --seed 20250531214408-board-titles.js
```

### Error: "Cannot delete from board_titles: FOREIGN KEY constraint failed"

**Cause:** Attempting to delete a title that has board_members referencing it.

**Solution:** This is expected behavior (RESTRICT constraint). Delete or update board_members records first, or rollback the entire migration:
```bash
npx sequelize-cli db:migrate:undo  # Drops board_members table
npx sequelize-cli db:migrate:undo  # Drops board_titles table
```

---

## Next Steps After Setup

Once migrations and seeds are complete:

1. **Create Board Models** (if not exists):
   - `backend/src/models/BoardTitle.js`
   - `backend/src/models/BoardMember.js`

2. **Implement Board Controllers**:
   - `backend/src/controllers/board.controller.js`

3. **Create Board Routes**:
   - `backend/src/routes/board.routes.js`

4. **Frontend Integration**:
   - Fetch and display board roster
   - Respect `board.visibility` config flag
   - Admin UI for managing board assignments

---

## Resources

- **Full Documentation:** `docs/migrations/BOARD_GOVERNANCE_MIGRATION_RUNBOOK.md`
- **Schema Diagram:** `docs/migrations/board-schema-erd.md`
- **Requirements:** `specifications.md` Section 2.1
- **Sequelize Docs:** https://sequelize.org/docs/v6/

---

**Need Help?**

Run the verification script for diagnostic information:
```bash
node scripts/verify-board-schema.js
```

Check the comprehensive runbook for detailed troubleshooting:
```bash
cat docs/migrations/BOARD_GOVERNANCE_MIGRATION_RUNBOOK.md
```

---

**Last Updated:** 2025-11-23
**Schema Version:** 1.0 (Task I1.T1)
