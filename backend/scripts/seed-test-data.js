#!/usr/bin/env node

/**
 * Seed test data for screenshot generation
 * This script populates the test database with realistic sample data
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Determine database path based on NODE_ENV
const dbPath = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '..', 'database', 'test.db')
  : path.join(__dirname, '..', 'database', 'hoa.db');

console.log('Seeding test data...');
console.log('Database path:', dbPath);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error('ERROR: Database file does not exist at:', dbPath);
  console.error('Please run migrations first: NODE_ENV=test npx sequelize-cli db:migrate');
  process.exit(1);
}

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

const adminPassword = bcrypt.hashSync('Admin123!@#', 10);
const memberPassword = bcrypt.hashSync('Member123!@#', 10);

db.serialize(() => {
  console.log('Inserting test users...');

  // Insert admin user
  db.run(`INSERT OR REPLACE INTO Users (id, name, email, password, role, status, isVerified, createdAt, updatedAt)
           VALUES (1, 'Admin User', 'admin@example.com', ?, 'admin', 'approved', 1, datetime('now'), datetime('now'))`,
         [adminPassword], (err) => {
           if (err) console.error('Error inserting admin user:', err);
           else console.log('✓ Admin user created');
         });

  // Insert member user
  db.run(`INSERT OR REPLACE INTO Users (id, name, email, password, role, status, isVerified, createdAt, updatedAt)
           VALUES (2, 'John Smith', 'member@example.com', ?, 'member', 'approved', 1, datetime('now'), datetime('now'))`,
         [memberPassword], (err) => {
           if (err) console.error('Error inserting member user:', err);
           else console.log('✓ Member user created');
         });

  // Insert pending user
  db.run(`INSERT OR REPLACE INTO Users (id, name, email, password, role, status, isVerified, createdAt, updatedAt)
           VALUES (3, 'Jane Doe', 'pending@example.com', ?, 'member', 'pending', 0, datetime('now'), datetime('now'))`,
         [memberPassword], (err) => {
           if (err) console.error('Error inserting pending user:', err);
           else console.log('✓ Pending user created');
         });

  console.log('Inserting sample announcements...');

  // Insert sample announcements
  db.run(`INSERT OR REPLACE INTO Announcements (id, title, content, expiresAt, createdBy, createdAt, updatedAt)
           VALUES (1, 'Welcome to Sanderson Creek HOA', 'We are excited to have you as part of our community. This portal allows you to stay connected with HOA announcements, events, and important documents. Please take some time to explore the features and reach out if you have any questions.', datetime('now', '+30 days'), 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting announcement 1:', err);
           else console.log('✓ Announcement 1 created');
         });

  db.run(`INSERT OR REPLACE INTO Announcements (id, title, content, expiresAt, createdBy, createdAt, updatedAt)
           VALUES (2, 'Pool Opening Schedule', 'The community pool will open for the season on June 1st. Pool hours are 6 AM to 10 PM daily. Please review the pool rules posted at the facility and remember to bring your HOA membership card for access.', datetime('now', '+60 days'), 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting announcement 2:', err);
           else console.log('✓ Announcement 2 created');
         });

  db.run(`INSERT OR REPLACE INTO Announcements (id, title, content, expiresAt, createdBy, createdAt, updatedAt)
           VALUES (3, 'Landscaping Improvements', 'We will be making landscaping improvements to the common areas throughout the month. Please pardon any temporary disruptions. The work is scheduled to be completed by the end of the month.', datetime('now', '+15 days'), 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting announcement 3:', err);
           else console.log('✓ Announcement 3 created');
         });

  console.log('Inserting sample events...');

  // Insert sample events
  db.run(`INSERT OR REPLACE INTO Events (id, title, description, location, startDate, endDate, createdBy, createdAt, updatedAt)
           VALUES (1, 'Annual HOA Meeting', 'Join us for our annual HOA meeting to discuss community improvements, budget proposals, and upcoming projects. Light refreshments will be provided. All residents are encouraged to attend.', 'Community Center - Main Hall', datetime('now', '+7 days'), datetime('now', '+7 days', '+2 hours'), 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting event 1:', err);
           else console.log('✓ Event 1 created');
         });

  db.run(`INSERT OR REPLACE INTO Events (id, title, description, location, startDate, endDate, createdBy, createdAt, updatedAt)
           VALUES (2, 'Summer BBQ Social', 'Annual summer BBQ event for all residents. Bring your family and meet your neighbors! Food and drinks will be provided. Please RSVP by June 15th so we can plan accordingly.', 'Community Park - Pavilion Area', datetime('now', '+21 days'), datetime('now', '+21 days', '+4 hours'), 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting event 2:', err);
           else console.log('✓ Event 2 created');
         });

  db.run(`INSERT OR REPLACE INTO Events (id, title, description, location, startDate, endDate, createdBy, createdAt, updatedAt)
           VALUES (3, 'Community Cleanup Day', 'Join your neighbors for our spring community cleanup day. We will be cleaning up common areas, planting flowers, and general maintenance. Volunteers are needed! Gloves and tools will be provided.', 'Meet at Community Center', datetime('now', '+14 days'), datetime('now', '+14 days', '+3 hours'), 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting event 3:', err);
           else console.log('✓ Event 3 created');
         });

  console.log('Inserting sample documents...');

  // Insert sample documents
  db.run(`INSERT OR REPLACE INTO Documents (id, title, description, fileName, filePath, fileSize, mimeType, visibility, status, uploadedBy, createdAt, updatedAt)
           VALUES (1, 'HOA Bylaws 2024', 'Official HOA bylaws and regulations governing the Sanderson Creek community.', 'hoa-bylaws-2024.pdf', '/uploads/documents/hoa-bylaws-2024.pdf', 245760, 'application/pdf', 'public', 'approved', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting document 1:', err);
           else console.log('✓ Document 1 created');
         });

  db.run(`INSERT OR REPLACE INTO Documents (id, title, description, fileName, filePath, fileSize, mimeType, visibility, status, uploadedBy, createdAt, updatedAt)
           VALUES (2, 'Community Guidelines', 'Guidelines for maintaining community standards and neighbor relations.', 'community-guidelines.pdf', '/uploads/documents/community-guidelines.pdf', 189440, 'application/pdf', 'public', 'approved', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting document 2:', err);
           else console.log('✓ Document 2 created');
         });

  db.run(`INSERT OR REPLACE INTO Documents (id, title, description, fileName, filePath, fileSize, mimeType, visibility, status, uploadedBy, createdAt, updatedAt)
           VALUES (3, 'Architectural Review Process', 'Process and forms for submitting architectural modification requests.', 'architectural-review.pdf', '/uploads/documents/architectural-review.pdf', 156672, 'application/pdf', 'public', 'approved', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting document 3:', err);
           else console.log('✓ Document 3 created');
         });

  db.run(`INSERT OR REPLACE INTO Documents (id, title, description, fileName, filePath, fileSize, mimeType, visibility, status, uploadedBy, createdAt, updatedAt)
           VALUES (4, '2024 Annual Budget', 'Annual budget for the HOA fiscal year 2024.', '2024-budget.pdf', '/uploads/documents/2024-budget.pdf', 98304, 'application/pdf', 'private', 'approved', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting document 4:', err);
           else console.log('✓ Document 4 created');
         });

  console.log('Inserting sample discussions...');

  // Insert sample discussions
  db.run(`INSERT OR REPLACE INTO Discussions (id, title, content, createdBy, createdAt, updatedAt)
           VALUES (1, 'Playground Equipment Upgrade', 'What do you think about upgrading the playground equipment in the park? I noticed some of the equipment is getting old and could use replacement. I would love to hear everyone\\'s thoughts and suggestions.', 2, datetime('now', '-2 days'), datetime('now', '-2 days'))`,
         (err) => {
           if (err) console.error('Error inserting discussion 1:', err);
           else console.log('✓ Discussion 1 created');
         });

  db.run(`INSERT OR REPLACE INTO Discussions (id, title, content, createdBy, createdAt, updatedAt)
           VALUES (2, 'Street Parking Concerns', 'Has anyone else noticed the street parking situation on Oak Street? With multiple families having several cars, it\\'s becoming difficult to find parking. Maybe we should discuss potential solutions at the next meeting.', 2, datetime('now', '-5 days'), datetime('now', '-5 days'))`,
         (err) => {
           if (err) console.error('Error inserting discussion 2:', err);
           else console.log('✓ Discussion 2 created');
         });

  db.run(`INSERT OR REPLACE INTO Discussions (id, title, content, createdBy, createdAt, updatedAt)
           VALUES (3, 'Dog Park Proposal', 'I would like to propose creating a dedicated dog park area in one of the unused common spaces. Many residents have dogs and this would be a great amenity for our community. Thoughts?', 2, datetime('now', '-10 days'), datetime('now', '-10 days'))`,
         (err) => {
           if (err) console.error('Error inserting discussion 3:', err);
           else console.log('✓ Discussion 3 created');
         });

  console.log('Inserting discussion replies...');

  // Insert sample discussion replies
  db.run(`INSERT OR REPLACE INTO DiscussionReplies (id, discussionId, content, createdBy, createdAt, updatedAt)
           VALUES (1, 1, 'Great idea! I have young kids and would definitely support upgrading the playground equipment. Safety should be a priority.', 3, datetime('now', '-1 days'), datetime('now', '-1 days'))`,
         (err) => {
           if (err) console.error('Error inserting reply 1:', err);
           else console.log('✓ Reply 1 created');
         });

  db.run(`INSERT OR REPLACE INTO DiscussionReplies (id, discussionId, content, createdBy, createdAt, updatedAt)
           VALUES (2, 2, 'I agree, parking has become an issue. Maybe we could look into creating additional parking spaces or implementing a parking permit system?', 1, datetime('now', '-4 days'), datetime('now', '-4 days'))`,
         (err) => {
           if (err) console.error('Error inserting reply 2:', err);
           else console.log('✓ Reply 2 created');
         });

  console.log('Inserting audit logs...');

  // Insert audit logs
  db.run(`INSERT OR REPLACE INTO AuditLogs (id, action, performedBy, targetType, targetId, details, createdAt, updatedAt)
           VALUES (1, 'user_login', 1, 'User', '1', '{"email":"admin@example.com"}', datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting audit log 1:', err);
           else console.log('✓ Audit log 1 created');
         });

  db.run(`INSERT OR REPLACE INTO AuditLogs (id, action, performedBy, targetType, targetId, details, createdAt, updatedAt)
           VALUES (2, 'announcement_created', 1, 'Announcement', '1', '{"title":"Welcome to Sanderson Creek HOA"}', datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting audit log 2:', err);
           else console.log('✓ Audit log 2 created');
         });

  db.run(`INSERT OR REPLACE INTO AuditLogs (id, action, performedBy, targetType, targetId, details, createdAt, updatedAt)
           VALUES (3, 'event_created', 1, 'Event', '1', '{"title":"Annual HOA Meeting"}', datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting audit log 3:', err);
           else console.log('✓ Audit log 3 created');
         });

  console.log('Inserting system configuration...');

  // Insert system config
  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('hoa_name', 'Sanderson Creek HOA', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config hoa_name:', err);
           else console.log('✓ Config hoa_name created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('hoa_description', 'A vibrant and welcoming community dedicated to maintaining high standards and fostering neighborly connections.', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config hoa_description:', err);
           else console.log('✓ Config hoa_description created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('contact_email', 'info@sandersoncreekhoa.com', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config contact_email:', err);
           else console.log('✓ Config contact_email created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('contact_phone', '(555) 123-4567', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config contact_phone:', err);
           else console.log('✓ Config contact_phone created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('hoa_address', '123 Sanderson Creek Blvd, Suite 100, Anytown, ST 12345', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config hoa_address:', err);
           else console.log('✓ Config hoa_address created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('website_url', 'https://www.sandersoncreekhoa.com', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config website_url:', err);
           else console.log('✓ Config website_url created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('office_hours', 'Monday - Friday: 9:00 AM - 5:00 PM', 1, datetime('now'), datetime('now'))`,
         (err) => {
           if (err) console.error('Error inserting config office_hours:', err);
           else console.log('✓ Config office_hours created');
         });

  db.run(`INSERT OR REPLACE INTO SystemConfigs (key, value, updatedBy, createdAt, updatedAt)
           VALUES ('emergency_contact', '(555) 911-HELP', 1, datetime('now'), datetime('now'))`, (err) => {
           if (err) {
             console.error('Error inserting config emergency_contact:', err);
           } else {
             console.log('✓ Config emergency_contact created');
           }

           // Close database after last insert
           db.close((err) => {
             if (err) {
               console.error('Error closing database:', err);
               process.exit(1);
             }
             console.log('\n✅ Test data seeded successfully!');
             console.log('Test users created:');
             console.log('  - Admin: admin@example.com / Admin123!@#');
             console.log('  - Member: member@example.com / Member123!@#');
             process.exit(0);
           });
         });
});
