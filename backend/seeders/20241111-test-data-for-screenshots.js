'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const adminPassword = bcrypt.hashSync('Admin123!@#', 10);
    const memberPassword = bcrypt.hashSync('Member123!@#', 10);

    // Insert test users
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        status: 'approved',
        email_verified: true,
        is_system_user: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'John Smith',
        email: 'member@example.com',
        password: memberPassword,
        role: 'member',
        status: 'approved',
        email_verified: true,
        is_system_user: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'Jane Doe',
        email: 'pending@example.com',
        password: memberPassword,
        role: 'member',
        status: 'pending',
        email_verified: false,
        is_system_user: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });

    // Insert sample announcements
    await queryInterface.bulkInsert('Announcements', [
      {
        id: 1,
        title: 'Welcome to Sanderson Creek HOA',
        content: 'We are excited to have you as part of our community. This portal allows you to stay connected with HOA announcements, events, and important documents. Please take some time to explore the features and reach out if you have any questions.',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: 'Pool Opening Schedule',
        content: 'The community pool will open for the season on June 1st. Pool hours are 6 AM to 10 PM daily. Please review the pool rules posted at the facility and remember to bring your HOA membership card for access.',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: 'Landscaping Improvements',
        content: 'We will be making landscaping improvements to the common areas throughout the month. Please pardon any temporary disruptions. The work is scheduled to be completed by the end of the month.',
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ignoreDuplicates: true });

    // Insert sample events
    await queryInterface.bulkInsert('Events', [
      {
        id: 1,
        title: 'Annual HOA Meeting',
        description: 'Join us for our annual HOA meeting to discuss community improvements, budget proposals, and upcoming projects. Light refreshments will be provided. All residents are encouraged to attend.',
        location: 'Community Center - Main Hall',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: 'Summer BBQ Social',
        description: 'Annual summer BBQ event for all residents. Bring your family and meet your neighbors! Food and drinks will be provided. Please RSVP by June 15th so we can plan accordingly.',
        location: 'Community Park - Pavilion Area',
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: 'Community Cleanup Day',
        description: 'Join your neighbors for our spring community cleanup day. We will be cleaning up common areas, planting flowers, and general maintenance. Volunteers are needed! Gloves and tools will be provided.',
        location: 'Meet at Community Center',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ignoreDuplicates: true });

    // Insert sample documents
    await queryInterface.bulkInsert('Documents', [
      {
        id: 1,
        title: 'HOA Bylaws 2024',
        description: 'Official HOA bylaws and regulations governing the Sanderson Creek community.',
        fileName: 'hoa-bylaws-2024.pdf',
        filePath: '/uploads/documents/hoa-bylaws-2024.pdf',
        fileSize: 245760,
        mimeType: 'application/pdf',
        visibility: 'public',
        status: 'approved',
        uploadedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: 'Community Guidelines',
        description: 'Guidelines for maintaining community standards and neighbor relations.',
        fileName: 'community-guidelines.pdf',
        filePath: '/uploads/documents/community-guidelines.pdf',
        fileSize: 189440,
        mimeType: 'application/pdf',
        visibility: 'public',
        status: 'approved',
        uploadedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: 'Architectural Review Process',
        description: 'Process and forms for submitting architectural modification requests.',
        fileName: 'architectural-review.pdf',
        filePath: '/uploads/documents/architectural-review.pdf',
        fileSize: 156672,
        mimeType: 'application/pdf',
        visibility: 'public',
        status: 'approved',
        uploadedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        title: '2024 Annual Budget',
        description: 'Annual budget for the HOA fiscal year 2024.',
        fileName: '2024-budget.pdf',
        filePath: '/uploads/documents/2024-budget.pdf',
        fileSize: 98304,
        mimeType: 'application/pdf',
        visibility: 'private',
        status: 'approved',
        uploadedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ignoreDuplicates: true });

    // Insert sample discussions
    await queryInterface.bulkInsert('Discussions', [
      {
        id: 1,
        title: 'Playground Equipment Upgrade',
        content: 'What do you think about upgrading the playground equipment in the park? I noticed some of the equipment is getting old and could use replacement. I would love to hear everyone\'s thoughts and suggestions.',
        createdBy: 2,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: 'Street Parking Concerns',
        content: 'Has anyone else noticed the street parking situation on Oak Street? With multiple families having several cars, it\'s becoming difficult to find parking. Maybe we should discuss potential solutions at the next meeting.',
        createdBy: 2,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: 'Dog Park Proposal',
        content: 'I would like to propose creating a dedicated dog park area in one of the unused common spaces. Many residents have dogs and this would be a great amenity for our community. Thoughts?',
        createdBy: 2,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ], { ignoreDuplicates: true });

    // Insert sample discussion replies
    await queryInterface.bulkInsert('DiscussionReplies', [
      {
        id: 1,
        discussionId: 1,
        content: 'Great idea! I have young kids and would definitely support upgrading the playground equipment. Safety should be a priority.',
        createdBy: 3,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        discussionId: 2,
        content: 'I agree, parking has become an issue. Maybe we could look into creating additional parking spaces or implementing a parking permit system?',
        createdBy: 1,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ], { ignoreDuplicates: true });

    // Insert audit logs
    await queryInterface.bulkInsert('AuditLogs', [
      {
        id: 1,
        action: 'user_login',
        performedBy: 1,
        targetType: 'User',
        targetId: '1',
        details: JSON.stringify({ email: 'admin@example.com' }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        action: 'announcement_created',
        performedBy: 1,
        targetType: 'Announcement',
        targetId: '1',
        details: JSON.stringify({ title: 'Welcome to Sanderson Creek HOA' }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        action: 'event_created',
        performedBy: 1,
        targetType: 'Event',
        targetId: '1',
        details: JSON.stringify({ title: 'Annual HOA Meeting' }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ignoreDuplicates: true });

    // Insert system config
    await queryInterface.bulkInsert('SystemConfigs', [
      {
        key: 'hoa_name',
        value: 'Sanderson Creek HOA',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hoa_description',
        value: 'A vibrant and welcoming community dedicated to maintaining high standards and fostering neighborly connections.',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'contact_email',
        value: 'info@sandersoncreekhoa.com',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'contact_phone',
        value: '(555) 123-4567',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hoa_address',
        value: '123 Sanderson Creek Blvd, Suite 100, Anytown, ST 12345',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'website_url',
        value: 'https://www.sandersoncreekhoa.com',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'office_hours',
        value: 'Monday - Friday: 9:00 AM - 5:00 PM',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'emergency_contact',
        value: '(555) 911-HELP',
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    // Remove test data
    await queryInterface.bulkDelete('AuditLogs', { id: [1, 2, 3] }, {});
    await queryInterface.bulkDelete('DiscussionReplies', { id: [1, 2] }, {});
    await queryInterface.bulkDelete('Discussions', { id: [1, 2, 3] }, {});
    await queryInterface.bulkDelete('Documents', { id: [1, 2, 3, 4] }, {});
    await queryInterface.bulkDelete('Events', { id: [1, 2, 3] }, {});
    await queryInterface.bulkDelete('Announcements', { id: [1, 2, 3] }, {});
    await queryInterface.bulkDelete('Users', { id: [1, 2, 3] }, {});
    await queryInterface.bulkDelete('SystemConfigs', {
      key: ['hoa_name', 'hoa_description', 'contact_email', 'contact_phone', 'hoa_address', 'website_url', 'office_hours', 'emergency_contact']
    }, {});
  }
};
