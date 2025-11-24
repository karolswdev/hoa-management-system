#!/usr/bin/env node

/**
 * Seed test data for screenshot generation against the current schema.
 * Uses the SQLite database produced by migrations (NODE_ENV=test).
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '..', 'database', 'test.db')
  : path.join(__dirname, '..', 'database', 'hoa.db');

console.log('Seeding test data...');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('ERROR: Database file does not exist at:', dbPath);
  console.error('Please run migrations first: NODE_ENV=test npx sequelize-cli db:migrate');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('SQL error:', err.message, '\n  ->', sql);
        return reject(err);
      }
      resolve(this);
    });
  });

const hashPassword = (plain) => bcrypt.hashSync(plain, 10);
const nowIso = () => new Date().toISOString();
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

async function seed() {
  try {
    await run('PRAGMA foreign_keys = OFF;');
    const tables = [
      'votes',
      'poll_options',
      'polls',
      'vendors',
      'board_members',
      'board_titles',
      'audit_logs',
      'announcements',
      'events',
      'documents',
      'discussions',
      'config',
      'users',
    ];
    for (const table of tables) {
      await run(`DELETE FROM ${table};`);
    }
    await run('PRAGMA foreign_keys = ON;');

    const adminPassword = hashPassword('Admin123!@#');
    const memberPassword = hashPassword('Member123!@#');

    console.log('Inserting users...');
    await run(
      `INSERT INTO users (id, name, email, password, role, status, email_verified, is_system_user, created_at, updated_at)
       VALUES (1, 'Admin User', 'admin@example.com', ?, 'admin', 'approved', 1, 0, ?, ?)`,
      [adminPassword, nowIso(), nowIso()]
    );
    await run(
      `INSERT INTO users (id, name, email, password, role, status, email_verified, is_system_user, created_at, updated_at)
       VALUES (2, 'John Smith', 'member@example.com', ?, 'member', 'approved', 1, 0, ?, ?)`,
      [memberPassword, nowIso(), nowIso()]
    );
    await run(
      `INSERT INTO users (id, name, email, password, role, status, email_verified, is_system_user, created_at, updated_at)
       VALUES (3, 'Jane Doe', 'pending@example.com', ?, 'member', 'pending', 0, 0, ?, ?)`,
      [memberPassword, nowIso(), nowIso()]
    );

    console.log('Inserting config...');
    const configEntries = [
      ['hoa_name', 'Sanderson Creek HOA'],
      ['hoa_description', 'A vibrant and welcoming community dedicated to maintaining high standards and fostering neighborly connections.'],
      ['contact_email', 'info@sandersoncreekhoa.com'],
      ['contact_phone', '(555) 123-4567'],
      ['hoa_address', '123 Sanderson Creek Blvd, Suite 100, Anytown, ST 12345'],
      ['website_url', 'https://www.sandersoncreekhoa.com'],
      ['office_hours', 'Monday - Friday: 9:00 AM - 5:00 PM'],
    ];
    for (const [key, value] of configEntries) {
      await run(`INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`, [key, value]);
    }

    console.log('Inserting announcements...');
    const announcements = [
      {
        id: 1,
        title: 'Welcome to Sanderson Creek HOA',
        content:
          'We are excited to have you as part of our community. Explore announcements, events, documents, and participate in polls.',
        expires_at: daysFromNow(30),
      },
      {
        id: 2,
        title: 'Pool Opening Schedule',
        content:
          'The community pool opens June 1st. Hours: 6 AM to 10 PM daily. Bring your HOA membership card for access.',
        expires_at: daysFromNow(60),
      },
      {
        id: 3,
        title: 'Landscaping Improvements',
        content:
          'Landscaping upgrades are underway. Please pardon any disruptions. Work is scheduled to finish this month.',
        expires_at: daysFromNow(15),
      },
    ];
    for (const a of announcements) {
      await run(
        `INSERT INTO announcements (id, title, content, expires_at, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [a.id, a.title, a.content, a.expires_at, nowIso(), nowIso()]
      );
    }

    console.log('Inserting events...');
    const events = [
      {
        id: 1,
        title: 'Annual HOA Meeting',
        description:
          'Discuss community improvements, budget proposals, and upcoming projects. Light refreshments provided.',
        location: 'Community Center - Main Hall',
        start_date: daysFromNow(7),
        end_date: daysFromNow(7.1),
      },
      {
        id: 2,
        title: 'Summer BBQ Social',
        description:
          'Annual summer BBQ for all residents. Food and drinks provided. Please RSVP by June 15th.',
        location: 'Community Park - Pavilion Area',
        start_date: daysFromNow(21),
        end_date: daysFromNow(21.2),
      },
      {
        id: 3,
        title: 'Community Cleanup Day',
        description:
          'Join neighbors for spring cleanup. Gloves and tools provided. Families welcome!',
        location: 'Meet at Community Center',
        start_date: daysFromNow(14),
        end_date: daysFromNow(14.1),
      },
    ];
    for (const e of events) {
      await run(
        `INSERT INTO events (id, title, description, start_date, end_date, location, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [e.id, e.title, e.description, e.start_date, e.end_date, e.location, nowIso(), nowIso()]
      );
    }

    console.log('Inserting documents...');
    const documents = [
      {
        id: 1,
        title: 'HOA Bylaws 2024',
        description: 'Official HOA bylaws and regulations.',
        file_name: 'hoa-bylaws-2024.pdf',
        original_file_name: 'HOA_Bylaws_2024.pdf',
        file_path: '/uploads/documents/hoa-bylaws-2024.pdf',
        approved: 1,
        is_public: 1,
      },
      {
        id: 2,
        title: 'Community Guidelines',
        description: 'Guidelines for maintaining community standards and neighbor relations.',
        file_name: 'community-guidelines.pdf',
        original_file_name: 'Community_Guidelines.pdf',
        file_path: '/uploads/documents/community-guidelines.pdf',
        approved: 1,
        is_public: 1,
      },
      {
        id: 3,
        title: '2024 Annual Budget',
        description: 'Annual budget for the HOA fiscal year 2024.',
        file_name: '2024-budget.pdf',
        original_file_name: '2024_Budget.pdf',
        file_path: '/uploads/documents/2024-budget.pdf',
        approved: 1,
        is_public: 0,
      },
    ];
    for (const d of documents) {
      await run(
        `INSERT INTO documents (id, title, description, file_name, original_file_name, file_path, uploaded_by, approved, is_public, uploaded_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        [
          d.id,
          d.title,
          d.description,
          d.file_name,
          d.original_file_name,
          d.file_path,
          d.approved,
          d.is_public,
          nowIso(),
          nowIso(),
        ]
      );
    }

    console.log('Inserting discussions (threads + replies)...');
    const discussions = [
      {
        id: 1,
        title: 'Playground Equipment Upgrade',
        content:
          'What do you think about upgrading the playground equipment? Safety should be a priority.',
        user_id: 2,
        parent_id: null,
      },
      {
        id: 2,
        title: 'Street Parking Concerns',
        content:
          'Parking on Oak Street is getting tight. Should we explore permits or more spaces?',
        user_id: 2,
        parent_id: null,
      },
      {
        id: 3,
        title: 'Dog Park Proposal',
        content:
          'Proposing a dedicated dog park in unused common space. Thoughts?',
        user_id: 2,
        parent_id: null,
      },
      {
        id: 4,
        title: null,
        content:
          'Great idea on the playground. Let’s prioritize safer slides and swings.',
        user_id: 3,
        parent_id: 1,
      },
      {
        id: 5,
        title: null,
        content:
          'Parking is tough on weekends. Maybe stripe angled spots?',
        user_id: 1,
        parent_id: 2,
      },
    ];
    for (const d of discussions) {
      await run(
        `INSERT INTO discussions (id, title, content, user_id, parent_id, document_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
        [d.id, d.title, d.content, d.user_id, d.parent_id, nowIso(), nowIso()]
      );
    }

    console.log('Inserting board roster...');
    const boardTitles = [
      { id: 1, title: 'President', rank: 1 },
      { id: 2, title: 'Vice President', rank: 2 },
      { id: 3, title: 'Treasurer', rank: 3 },
      { id: 4, title: 'Secretary', rank: 4 },
    ];
    for (const t of boardTitles) {
      await run(
        `INSERT INTO board_titles (id, title, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [t.id, t.title, t.rank, nowIso(), nowIso()]
      );
    }
    const boardMembers = [
      { id: 1, user_id: 1, title_id: 1, start_date: '2024-01-01', bio: 'Leads governance and strategy.' },
      { id: 2, user_id: 2, title_id: 3, start_date: '2024-03-01', bio: 'Oversees budget and finance.' },
    ];
    for (const m of boardMembers) {
      await run(
        `INSERT INTO board_members (id, user_id, title_id, start_date, end_date, bio, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
        [m.id, m.user_id, m.title_id, m.start_date, m.bio, nowIso(), nowIso()]
      );
    }

    console.log('Inserting vendors...');
    const vendors = [
      {
        id: 1,
        name: 'GreenLeaf Landscaping',
        service_category: 'Landscaping',
        contact_info: 'contact@greenleaf.com | (555) 222-1000',
        rating: 5,
        notes: 'Excellent seasonal maintenance; responsive to requests.',
        visibility_scope: 'members',
        moderation_state: 'approved',
        created_by: 1,
      },
      {
        id: 2,
        name: 'SecureHome Patrol',
        service_category: 'Security',
        contact_info: 'dispatch@securehome.com | (555) 333-9000',
        rating: 4,
        notes: 'Nightly patrols with weekly reports.',
        visibility_scope: 'public',
        moderation_state: 'approved',
        created_by: 1,
      },
      {
        id: 3,
        name: 'Sparkle Pools',
        service_category: 'Pool Maintenance',
        contact_info: 'service@sparklepools.com | (555) 444-7777',
        rating: 0,
        notes: 'Pending evaluation for summer season.',
        visibility_scope: 'admins',
        moderation_state: 'pending',
        created_by: 2,
      },
    ];
    for (const v of vendors) {
      await run(
        `INSERT INTO vendors (id, name, service_category, contact_info, rating, notes, visibility_scope, moderation_state, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          v.id,
          v.name,
          v.service_category,
          v.contact_info,
          v.rating,
          v.notes,
          v.visibility_scope,
          v.moderation_state,
          v.created_by,
          nowIso(),
          nowIso(),
        ]
      );
    }

    console.log('Inserting polls + votes...');
    const polls = [
      {
        id: 1,
        title: 'Community Garden Expansion',
        description: 'Should we allocate funds to expand the community garden plots?',
        type: 'binding',
        is_anonymous: false,
        notify_members: false,
        start_at: daysFromNow(-1),
        end_at: daysFromNow(14),
      },
      {
        id: 2,
        title: 'Amenity Upgrade Priority',
        description: 'Which amenity should we prioritize next quarter?',
        type: 'informal',
        is_anonymous: true,
        notify_members: false,
        start_at: daysFromNow(-20),
        end_at: daysFromNow(-5),
      },
    ];
    for (const p of polls) {
      await run(
        `INSERT INTO polls (id, title, description, type, is_anonymous, notify_members, start_at, end_at, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          p.id,
          p.title,
          p.description,
          p.type,
          p.is_anonymous ? 1 : 0,
          p.notify_members ? 1 : 0,
          p.start_at,
          p.end_at,
          nowIso(),
          nowIso(),
        ]
      );
    }

    const pollOptions = [
      { id: 1, poll_id: 1, text: 'Approve budget for expansion', order_index: 1 },
      { id: 2, poll_id: 1, text: 'Request revised plan', order_index: 2 },
      { id: 3, poll_id: 1, text: 'Reject expansion', order_index: 3 },
      { id: 4, poll_id: 2, text: 'Upgrade fitness center', order_index: 1 },
      { id: 5, poll_id: 2, text: 'Resurface tennis courts', order_index: 2 },
      { id: 6, poll_id: 2, text: 'Enhance playground', order_index: 3 },
    ];
    for (const o of pollOptions) {
      await run(
        `INSERT INTO poll_options (id, poll_id, text, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [o.id, o.poll_id, o.text, o.order_index, nowIso(), nowIso()]
      );
    }

    const voteHash1 = crypto.createHash('sha256').update('vote1').digest('hex');
    const voteHash2 = crypto.createHash('sha256').update('vote2').digest('hex');
    const receipt1 = 'RCPT-DEMO-001';
    const receipt2 = 'RCPT-DEMO-002';
    await run(
      `INSERT INTO votes (poll_id, user_id, option_id, timestamp, prev_hash, vote_hash, receipt_code, created_at, updated_at)
       VALUES (1, 2, 1, ?, NULL, ?, ?, ?, ?)`,
      [nowIso(), voteHash1, receipt1, nowIso(), nowIso()]
    );
    await run(
      `INSERT INTO votes (poll_id, user_id, option_id, timestamp, prev_hash, vote_hash, receipt_code, created_at, updated_at)
       VALUES (1, 3, 2, ?, ?, ?, ?, ?, ?)`,
      [nowIso(), voteHash1, voteHash2, receipt2, nowIso(), nowIso()]
    );

    console.log('Inserting audit logs...');
    await run(
      `INSERT INTO audit_logs (id, admin_id, action, details, created_at)
       VALUES (1, 1, 'user_login', '{"email":"admin@example.com"}', ?)`,
      [nowIso()]
    );
    await run(
      `INSERT INTO audit_logs (id, admin_id, action, details, created_at)
       VALUES (2, 1, 'announcement_created', '{"title":"Welcome to Sanderson Creek HOA"}', ?)`,
      [nowIso()]
    );
    await run(
      `INSERT INTO audit_logs (id, admin_id, action, details, created_at)
       VALUES (3, 1, 'event_created', '{"title":"Annual HOA Meeting"}', ?)`,
      [nowIso()]
    );

    console.log('\n✅ Test data seeded successfully!');
    console.log('Test users:');
    console.log('  - Admin: admin@example.com / Admin123!@#');
    console.log('  - Member: member@example.com / Member123!@#');
    db.close();
  } catch (err) {
    console.error('Seeding failed:', err);
    db.close(() => process.exit(1));
  }
}

seed();
