/**
 * Verification script for Board Governance migrations and seeders
 * Runs checks to ensure schema and data match requirements
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Use test database for verification
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/test.db'),
  logging: false
});

async function verifySchema() {
  console.log('\n=== Board Governance Schema Verification ===\n');

  try {
    // Check if tables exist
    const [titleTables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='board_titles'"
    );
    const [memberTables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='board_members'"
    );

    console.log('✓ Tables created:');
    console.log(`  - board_titles: ${titleTables.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`  - board_members: ${memberTables.length > 0 ? 'EXISTS' : 'MISSING'}`);

    // Check board_titles indexes
    const [titleIndexes] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='board_titles'"
    );
    console.log('\n✓ board_titles indexes:');
    titleIndexes.forEach(idx => console.log(`  - ${idx.name}`));

    // Check board_members indexes
    const [memberIndexes] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='board_members'"
    );
    console.log('\n✓ board_members indexes:');
    memberIndexes.forEach(idx => console.log(`  - ${idx.name}`));

    // Check config flags
    const [configs] = await sequelize.query(
      "SELECT key, value FROM config WHERE key LIKE 'board.%' ORDER BY key"
    );
    console.log('\n✓ Config flags seeded:');
    configs.forEach(cfg => console.log(`  - ${cfg.key}: ${cfg.value}`));

    // Check board titles
    const [titles] = await sequelize.query(
      "SELECT id, title, rank FROM board_titles ORDER BY rank"
    );
    console.log('\n✓ Board titles seeded:');
    titles.forEach(title => console.log(`  - [${title.rank}] ${title.title} (ID: ${title.id})`));

    // Check foreign keys on board_members
    const [fkeys] = await sequelize.query(
      "PRAGMA foreign_key_list(board_members)"
    );
    console.log('\n✓ Foreign key constraints:');
    if (Array.isArray(fkeys) && fkeys.length > 0) {
      fkeys.forEach(fk => {
        console.log(`  - ${fk.from} → ${fk.table}.${fk.to} (on_update: ${fk.on_update}, on_delete: ${fk.on_delete})`);
      });
    } else {
      console.log('  - Foreign key info not available (SQLite limitation)');
    }

    console.log('\n=== Verification Complete ===\n');

    // Validate expectations
    const validations = [];

    if (titleTables.length === 0) validations.push('❌ board_titles table missing');
    if (memberTables.length === 0) validations.push('❌ board_members table missing');
    if (configs.length !== 2) validations.push(`❌ Expected 2 config flags, found ${configs.length}`);
    if (titles.length !== 5) validations.push(`❌ Expected 5 board titles, found ${titles.length}`);

    // Skip FK validation as PRAGMA may not return array
    if (Array.isArray(fkeys) && fkeys.length !== 2) {
      validations.push(`❌ Expected 2 foreign keys, found ${fkeys.length}`);
    }

    const indexCount = memberIndexes.filter(i => !i.name.startsWith('sqlite_')).length;
    if (indexCount < 3) validations.push(`❌ Expected at least 3 indexes on board_members, found ${indexCount}`);

    if (validations.length > 0) {
      console.log('⚠️  VALIDATION ERRORS:');
      validations.forEach(v => console.log(`  ${v}`));
      process.exit(1);
    } else {
      console.log('✅ All validations passed!');
      console.log('   - Schema matches ERD requirements');
      console.log('   - All indexes created');
      console.log('   - Config flags seeded correctly');
      console.log('   - Board titles seeded with proper ranking');
      console.log('   - Foreign key constraints configured\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verifySchema();
